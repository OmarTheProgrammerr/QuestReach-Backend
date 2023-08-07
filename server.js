require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const vCard = require("vcards-js");
const app = express();
const QRCode = require("qrcode");
const multer = require("multer");
const upload = multer();
const zlib = require("pako");
const base64 = require("base64-js");

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "QuestReach",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((error) => console.error("Error connecting to MongoDB:", error));

const contactSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    company: String,
    phoneNumber: String,
    email: String,
    ringtone: String,
    textTone: String,
    url: String,
    address: String,
    date: Date,
    relatedName: String,
    socialProfile: String,
    instantMessage: String,
    prefix: String,
    phoneticFirstName: String,
    pronunciationFirstName: String,
    middleName: String,
    phoneticLastName: String,
    maidenName: String,
    suffix: String,
    nickname: String,
    jobTitle: String,
    department: String,
    phoneticCompanyName: String,
    qrStyle: String,
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema, "ContactInfo");

app.enable("trust proxy");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Hello, world!");
});
console.log("Hello 1");
app.post("/contact", upload.single("image"), async (req, res) => {
  console.log("Received a request at /contact");
  console.log("Request body:", req.body);

  const newContact = new Contact(req.body);

  try {
    const contact = await newContact.save();
    console.log("Contact ID:", contact._id);

    console.log("Protocol:", req.protocol);
    console.log("Host:", req.get("host"));

    setTimeout(function () {
      QRCode.toDataURL(
        `${req.protocol}://${req.get(
          "host"
        )}/contact/${contact._id.toString()}`,
        {
          errorCorrectionLevel: "L",
        },
        function (err, url) {
          if (err) console.error(err);
          else res.status(200).json({ url: url, id: contact._id });
        }
      );
    }, 6000); // 2000 milliseconds = 2 seconds
  } catch (error) {
    console.error("Error saving contact or generating QR code:", error);
    res.status(500).json({ error: error.toString() });
  }
});
console.log("Hello 2");
app.get("/contact/:id", async (req, res) => {
  console.log(`Received a request at /contact/${req.params.id}`);

  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    res.json(contact);
  } catch (error) {
    console.error("Error retrieving contact:", error);
    res.status(500).json({ error: error.toString() });
  }
});

app.use((err, req, res, next) => {
  console.log("Hello 3");
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
