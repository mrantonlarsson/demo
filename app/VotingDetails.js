import React, { useState } from "react";
import { View, ScrollView, Text, Button, Linking, Image, Dimensions } from "react-native";

const partyIcons = {
  c: require("./data/c.png"),
  kd: require("./data/kd.png"),
  l: require("./data/l.png"),
  m: require("./data/m.png"),
  mp: require("./data/mp.png"),
  s: require("./data/s.png"),
  sd: require("./data/sd.png"),
  v: require("./data/v.png"),
};

const chunkArray = (array, size) => {
  if (!Array.isArray(array)) {
    console.error("The provided value is not an array:", array);
    return [];
  }

  const chunked = [];
  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, size + index));
    index += size;
  }
  return chunked;
};

const openURL = (url) => {
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      console.log(`Don't know how to open URL: ${url}`);
    }
  });
};

const VotingDetails = ({ route, userVotes, setUserVotes, groupVotesByParty }) => {
  if (!route || !route.params) {
    console.error("Missing route or route.params in VotingDetails");
    return <Text style={{ paddingTop: 50 }}>Error: Missing required navigation parameters.</Text>;
  }

  const { votes, dok_id, url, votingName } = route.params;

  const groupedVotes = groupVotesByParty(votes);

  const handleVote = (dok_id, vote) => {
    setUserVotes((prevVotes) => ({
      ...prevVotes,
      [dok_id]: vote,
    }));
  };

  const partiesFor = Object.keys(groupedVotes).filter(
    (party) => groupedVotes[party].Ja > groupedVotes[party].Nej
  );

  const partiesAgainst = Object.keys(groupedVotes).filter(
    (party) => groupedVotes[party].Nej > groupedVotes[party].Ja
  );

  const chunkedPartiesFor = chunkArray(partiesFor, 3);
  const chunkedPartiesAgainst = chunkArray(partiesAgainst, 3);

  const totalVotesFor = Object.values(groupedVotes).reduce((acc, votes) => acc + votes.Ja, 0);

  const totalVotesAgainst = Object.values(groupedVotes).reduce((acc, votes) => acc + votes.Nej, 0);

  const result = totalVotesFor > totalVotesAgainst ? "Passed" : "Failed";

  const columns = Math.floor((Dimensions.get("window").width - 40) / 80);

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ fontWeight: "bold", marginTop: 20, fontSize: 20, textAlign: "center" }}>
          Voting Name: {votingName}
        </Text>
        <Button title="Read More" onPress={() => openURL(url)} />
        <Text style={{ fontWeight: "bold", marginTop: 20, fontSize: 20, textAlign: "center" }}>
          Your vote
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 20,
            marginHorizontal: 60,
          }}
        >
          <Button title="Yes" onPress={() => handleVote(dok_id, "Ja")} />
          <Button title="Abstain" onPress={() => handleVote(dok_id, "Avstår")} />
          <Button title="No" onPress={() => handleVote(dok_id, "Nej")} />
        </View>

        <Text style={{ marginTop: 20, fontSize: 20, textAlign: "center" }}>
          Your Vote: {userVotes[dok_id] || "Not Voted"}
        </Text>

        <Text style={{ fontWeight: "bold", marginTop: 20, fontSize: 20, textAlign: "center" }}>
          Result: {result}
        </Text>

        <Text style={{ fontWeight: "bold", marginTop: 20, textAlign: "center" }}>
          Votes For: {totalVotesFor}
        </Text>
        {chunkedPartiesFor.map((partyGroup, index) => (
          <View
            key={index}
            style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}
          >
            {partyGroup.map((party) => (
              <View key={party} style={{ flex: 1, alignItems: "center" }}>
                <Image source={partyIcons[party.toLowerCase()]} style={{ width: 80, height: 80 }} />
              </View>
            ))}
          </View>
        ))}

        <Text style={{ fontWeight: "bold", marginTop: 20, textAlign: "center" }}>
          Votes Against: {totalVotesAgainst}
        </Text>
        {chunkedPartiesAgainst.map((partyGroup, index) => (
          <View
            key={index}
            style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}
          >
            {partyGroup.map((party) => (
              <View key={party} style={{ flex: 1, alignItems: "center" }}>
                <Image source={partyIcons[party.toLowerCase()]} style={{ width: 80, height: 80 }} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default VotingDetails;
