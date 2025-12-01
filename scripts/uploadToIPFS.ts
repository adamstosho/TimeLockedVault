import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";

const PINATA_API_KEY = "6c01053951e2cf255106";
const PINATA_SECRET_KEY = "7c892d891e8e924249d8ccb70b7dd46cbdf69df34f48b645ffdf792312dca904";


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
    console.error("ERROR: PINATA_API_KEY and PINATA_SECRET_KEY must be set in hardhat.config.ts vars");
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

