import React from "react";
import { View, FlatList, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const VotingsList = ({ data = [], userVotes, groupVotesByParty }) => {
  const navigation = useNavigation();
  const votedVotings = data.filter((voting) => userVotes[`${voting.dok_id}`]);
  const notVotedVotings = data.filter((voting) => !userVotes[`${voting.dok_id}`]);

  const VotingItem = React.memo(({ item, userVotes, navigation }) => (
    <TouchableOpacity
      style={{ flex: 1 }}
      onPress={() => {
        navigation.navigate("VotingDetails", {
          votes: item.votes,
          dok_id: item.dok_id,
          votingName: item.votingName,
          url: item.votingURL,
        });
      }}
    >
      <View style={{ padding: 10, borderBottomWidth: 1, borderColor: "#ccc" }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.votingName}</Text>
        <Text style={{ fontSize: 15, fontWeight: "bold", paddingTop: 5 }}>
          {item.votes[0].datum}
        </Text>
      </View>
    </TouchableOpacity>
  ));

  const renderItem = ({ item }) => (
    <VotingItem item={item} userVotes={userVotes} navigation={navigation} />
  );

  return (
    <View style={{ flex: 1, alignItems: "center", width: "100%" }}>
      <FlatList
        data={notVotedVotings}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.dok_id}`}
        initialNumToRender={10}
      />
    </View>
  );
};

export default VotingsList;
