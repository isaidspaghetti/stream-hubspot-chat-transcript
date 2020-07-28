import React, { useState } from 'react';
import { Chat, Channel, ChannelHeader, MessageInput, MessageList, Thread, Window, } from 'stream-chat-react';
import { StreamChat } from 'stream-chat';
import 'stream-chat-react/dist/css/index.css'

function App() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);

  const register = async (e) => {
    try {
      e.preventDefault();

      const response = await fetch('http://localhost:8080/registrations', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
        }),
      });

      const { customerId, customerToken, channelId, apiKey } = await response.json();
      const chatClient = new StreamChat(apiKey);

      await chatClient.setUser(
        {
          id: customerId,
          name: firstName,
        },
        customerToken,
      );

      const channel = chatClient.channel('messaging', channelId);
      setChatClient(chatClient);
      setChannel(channel);
    } catch (e) {
      console.error(e);
    }
  };

  if (chatClient && channel) {
    return (
      <div className="App">
        <Chat client={chatClient} theme={'messaging light'}>
          <Channel channel={channel}>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    );
  } else {
    return (
      <div className="App container">
        <form className="card" onSubmit={register}>
          <label>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="first name"
            required
          />
          <label>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="last name"
            required
          />
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            required
          />
          <button type="submit">
            Start chat
          </button>
        </form>
      </div>
    );
  }
}

export default App;
