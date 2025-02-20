require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า Verify Token
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "your_verify_token";
const PAGE_ACCESS_TOKEN =
  process.env.PAGE_ACCESS_TOKEN || "your_page_access_token";

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.status(200).send("Start Server chatbot");
});
// ✅ Webhook สำหรับ Verify Token
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

// ✅ Webhook สำหรับรับข้อความจาก Messenger
app.post("/webhook", (req, res) => {
  let body = req.body;

  if (body.object === "page") {
    body.entry.forEach((entry) => {
      let event = entry.messaging[0];
      let senderId = event.sender.id;

      if (event.message && event.message.text) {
        let userMessage = event.message.text.toLowerCase(); // แปลงเป็นตัวพิมพ์เล็กเพื่อตรวจสอบง่ายขึ้น
        console.log(`📩 Received message: ${userMessage}`);

        let replyText = checkMessage(userMessage);
        sendMessage(senderId, replyText);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ✅ ฟังก์ชันตรวจสอบข้อความและส่งคำตอบที่กำหนด
const checkMessage = (message) => {
  console.log("message ---> ", message);
  if (message.includes("สวัสดี") || message.includes("hello")) {
    return "สวัสดีครับ! มีอะไรให้ช่วยไหม?";
  } else if (message.includes("ราคา") || message.includes("price")) {
    return "คุณต้องการสอบถามราคาอะไรครับ?";
  } else if (message.includes("ขอบคุณ") || message.includes("thanks")) {
    return "ยินดีครับ 😊";
  } else {
    return "ขอโทษครับ ผมไม่เข้าใจคำถามของคุณ 😅";
  }
};

// ✅ ฟังก์ชันส่งข้อความกลับไปยังผู้ใช้
const sendMessage = (senderId, text) => {
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
        console.log("✅ Message sent successfully!");
      } else {
        console.error("❌ Unable to send message:", error);
      }
    }
  );
};

app.listen(3005, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
