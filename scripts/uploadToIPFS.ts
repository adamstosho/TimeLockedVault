import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";
import * as dotenv from "dotenv";

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;


async function uploadJSONToPinata(jsonContent: object, fileName: string): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataContent: jsonContent,
        pinataMetadata: {
          name: fileName,
        },
        pinataOptions: {
          cidVersion: 0,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  } catch (error: any) {
    console.error("Error uploading JSON to Pinata:", error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log("Uploading NFT metadata to IPFS via Pinata...");
  console.log("=============================================");

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.error("ERROR: PINATA_API_KEY and PINATA_SECRET_KEY must be set in your .env file");
    console.error("Please create a .env file with:");
    console.error("PINATA_API_KEY=your_api_key");
    console.error("PINATA_SECRET_KEY=your_secret_key");
    process.exit(1);
  }

  const metadataDir = path.join(__dirname, "../metadata");
  const files = fs.readdirSync(metadataDir).filter((f) => f.endsWith(".json"));

  console.log(`Found ${files.length} metadata files to upload\n`);

  const uploadedURIs: { [key: string]: string } = {};

  for (const file of files) {
    const filePath = path.join(metadataDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const jsonContent = JSON.parse(fileContent);

    console.log(`Uploading ${file}...`);
    try {
      const ipfsURI = await uploadJSONToPinata(jsonContent, file);
      uploadedURIs[file] = ipfsURI;
      console.log(`✓ ${file} uploaded to: ${ipfsURI}\n`);
    } catch (error) {
      console.error(`✗ Failed to upload ${file}\n`);
    }
  }

  console.log("\n=============================================");
  console.log("Upload Summary:");
  console.log("=============================================");
  
  for (const [file, uri] of Object.entries(uploadedURIs)) {
    console.log(`${file}: ${uri}`);
  }

  const urisFile = path.join(__dirname, "../ipfs-uris.json");
  fs.writeFileSync(urisFile, JSON.stringify(uploadedURIs, null, 2));
  console.log(`\n✓ URIs saved to: ${urisFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

