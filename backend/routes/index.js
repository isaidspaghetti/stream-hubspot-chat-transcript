const express = require('express');
const router = express.Router();
const { StreamChat } = require('stream-chat');
const { default: axios } = require('axios');

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
const hubspotKey = process.env.HUBSPOT_API_KEY;

async function createHubspotContact(firstName, lastName, email) {
  let hubspotContact;
  try {
    hubspotContact = await axios.get(`https://api.hubapi.com/crm/v3/objects/contacts/${email}/?idProperty=email&hapikey=${hubspotKey}`);
  }
  catch {
    hubspotContact = await axios.post(`https://api.hubapi.com/crm/v3/objects/contacts?hapikey=${hubspotKey}`,
      {
        properties: {
          'firstname': firstName,
          'lastname': lastName,
          'email': email,
        }
      }
    );
  }

  return hubspotContact.data.id;
}

function createUsers(firstName, lastName) {
  const customer = {
    id: `${firstName}-${lastName}`.toLowerCase(),
    name: firstName,
    role: 'user',
  };

  const admin = {
    id: 'admin-id',
    name: 'Support Admin',
    role: 'admin'
  };

  return [customer, admin];
}

router.post('/registrations', async (req, res) => {
  try {
    const firstName = req.body.firstName.replace(/\s/g, '_');
    const lastName = req.body.lastName.replace(/\s/g, '_');
    const email = req.body.email.toLowerCase();
    const hubspotContactId = await createHubspotContact(firstName, lastName, email);

    const client = new StreamChat(apiKey, apiSecret);

    [customer, admin] = createUsers(firstName, lastName);

    await client.upsertUsers([
      customer,
      admin
    ]);

    const channel = client.channel('messaging', hubspotContactId, {
      members: [customer.id, admin.id],
    });

    const customerToken = client.createToken(customer.id);

    res.status(200).json({
      customerId: customer.id,
      customerToken,
      channelId: channel.id,
      apiKey,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks', async (req, res) => {
  if (req.body.type === 'message.new') {
    try {
      const newMessage = req.body.message;
      const hubspotContactId = req.body.channel_id;

      const customerResponse = await axios
        .get(`https://api.hubapi.com/crm/v3/objects/contacts/${hubspotContactId}`, {
          params: {
            properties: 'chat_transcript',
            archived: false,
            hapikey: hubspotKey,
          }
        });
      let localTranscript = customerResponse.data.properties.chat_transcript;
      if (!localTranscript) { localTranscript = ""; }
      let updatedTranscript = `${localTranscript}\n FROM: ${newMessage.user.id}\n SENT AT: ${newMessage.created_at}\n MESSAGE: ${newMessage.text}`;

      await axios
        .patch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubspotContactId}?hapikey=${hubspotKey}`, {
          properties: {
            'chat_transcript': updatedTranscript,
          }
        });
    } catch (err) {
      res.status(200).end();
    }
  }

  res.status(200).end();
});

module.exports = router;

