import { JSDOM } from "jsdom";
import fs from "fs";
import Papa from "papaparse";

let fetch;

function generateVotingURL(dok_id) {
  return `https://data.riksdagen.se/votering/${dok_id}/html`;
}

import("node-fetch").then((module) => {
  fetch = module.default;
  main().catch((error) => {
    console.error("Error:", error);
  });
});

async function fetchVotingName(dok_id) {
  const url = `https://data.riksdagen.se/votering/${dok_id}/html`;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const votingName = dom.window.document.querySelector("h1").textContent;
    console.log(votingName);
    return votingName;
  } catch (error) {
    console.error("Error fetching voting name:", error);
    return null;
  }
}

async function fetchAllVotingNames(dok_ids) {
  const votingNames = {};
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log("Found " + dok_ids.length + " different votings to fetch");

  let minutes = Math.floor(dok_ids.length / 60);
  let seconds = dok_ids.length % 60;

  console.log(
    "Estimated time to fetch all names: " + minutes + " minutes " + seconds + " seconds."
  );

  console.log("Staring to fetch...");

  for (const dok_id of dok_ids) {
    const name = await fetchVotingName(dok_id);
    if (name) {
      votingNames[dok_id] = name;
    }
    await delay(1000);
  }

  return votingNames;
}

async function main() {
  const csvContent = fs.readFileSync("./app/data/votings-final.csv", "utf-8");

  const parsedData = Papa.parse(csvContent, { header: true }).data;

  const dok_ids = [...new Set(parsedData.map((row) => row.dok_id))];

  const votingNames = await fetchAllVotingNames(dok_ids);

  const updatedData = parsedData.map((row) => ({
    ...row,
    votingName: votingNames[row.dok_id],
    votingURL: generateVotingURL(row.dok_id),
  }));

  const updatedCsvContent = Papa.unparse(updatedData);

  fs.writeFileSync("./app/data/votings-final-updated.csv", updatedCsvContent);

  console.log("CSV file updated!");
}
