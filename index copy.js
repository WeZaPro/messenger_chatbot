require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า Verify Token
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "your_verify_token";

app.use(bodyParser.json());

// Webhook สำหรับ Verify Token (ใช้ตอนตั้งค่า Webhook ใน Facebook Developer)
app.get("/webhook", (req, res) => {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook Verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook สำหรับรับข้อความจาก Messenger
app.post("/webhook", (req, res) => {
  let body = req.body;

  if (body.object === "page") {
    body.entry.forEach((entry) => {
      let event = entry.messaging[0];
      let senderId = event.sender.id;

      if (event.message) {
        let text = event.message.text;
        console.log(`Received message: ${text}`);

        sendMessage(senderId, `คุณพิมพ์ว่า: ${text}`);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ฟังก์ชันส่งข้อความกลับไปยังผู้ใช้
const sendMessage = (senderId, text) => {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  const request = require("request");

  let messageData = {
    recipient: { id: senderId },
    message: { text: text },
  };

  request(
    {
      uri: "https://graph.facebook.com/v18.0/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: messageData,
    },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        console.log("Message sent successfully!");
      } else {
        console.error("Unable to send message:", error);
      }
    }
  );
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
