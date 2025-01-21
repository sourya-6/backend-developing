import nodemailer from "nodemailer";
//import dotenv from "dotenv";

//dotenv.config();
console.log(process.env.EMAIL_USER)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail ID
    pass: process.env.EMAIL_PASS, // Your Gmail App Password
  },
});

export const  sendWelcomeEmail = async (userEmail, userName) => {
  console.log('hey',userEmail)
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "🎉 Welcome to SnapBuy!",
      html: `
        <h1>Welcome to SnapBuy, ${userName}! 🎉</h1>
        <p>We're excited to have you as a customer.</p>
        <p>Start shopping now and enjoy the best deals on your favorite products.</p>
        <p>Happy Shopping! 🛒</p>
        <br>
        <p>Best Regards,</p>
        <p><strong>SnapBuy Team</strong></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("📩 Welcome email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
  }
};

//sendWelcomeEmail(userEmail,userName);

