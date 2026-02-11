import { generateCaseNote } from "../src/app/actions/generateCaseNote";
import * as dotenv from "dotenv";

dotenv.config();

async function testOllama() {
    console.log("Testing generateCaseNote with Clinical Resource Logic...");

    // Structured "Data Packet" as recommended
    const rawInput = `
    Client Age: 24
    Housing Status: Couch surfing with friends
    Employment: Unemployed, interested in forklift certification
    Legal: On active probation
    Transport: No car, uses bus
    Disability Noted: None
  `;

    const type = "General";
    const clientName = "Jane Doe";

    try {
        const note = await generateCaseNote(rawInput, type, clientName);
        console.log("\n--- Generated Report ---\n");
        console.log(note);
        console.log("\n------------------------\n");

        // Simple assertion logging
        if (note.includes("Paving the Way") && note.includes("AVTA")) {
            console.log("SUCCESS: 'Paving the Way' and 'AVTA' referrals found.");
        } else {
            console.log("WARNING: Expected referrals might be missing.");
        }

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testOllama();
