import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import VotingsList from "./VotingsList";
import VotingDetails from "./VotingDetails";
import Papa from "papaparse";
import { Asset } from "expo-asset";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import profileImage from "./data/profile.png";
import { useNavigation } from "@react-navigation/native";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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

const groupVotesByParty = (votes) => {
  return votes.reduce((acc, curr) => {
    if (!acc[curr.parti]) {
      acc[curr.parti] = { Ja: 0, Nej: 0, Avstår: 0, Frånvarande: 0 };
    }
    acc[curr.parti][curr.rost]++;
    return acc;
  }, {});
};

const calculateAlignment = (data, userVotes, groupVotesByParty) => {
  const partyScores = {};

  data.forEach((voting) => {
    const userVote = userVotes[voting.dok_id];
    if (!userVote) return;

    const partyVotes = groupVotesByParty(voting.votes);

    for (let party in partyVotes) {
      if (!partyScores[party]) partyScores[party] = 0;

      const majorityVote = partyVotes[party].Ja > partyVotes[party].Nej ? "Ja" : "Nej";
      if (userVote === majorityVote) {
        partyScores[party]++;
      }
    }
  });

  return partyScores;
};

function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home Screen</Text>
    </View>
  );
}

function VoteScreen({ data, userVotes, setUserVotes, groupVotesByParty }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", width: "100%" }}>
      <Stack.Navigator initialRouteName="VotingsList">
        <Stack.Screen
          name="VotingsList"
          options={{ title: "Not Voted" }}
          children={(props) => (
            <VotingsList
              {...props}
              data={data}
              userVotes={userVotes}
              setUserVotes={setUserVotes}
              groupVotesByParty={groupVotesByParty}
              calculateAlignment={calculateAlignment}
            />
          )}
        />
        <Stack.Screen
          name="VotingDetails"
          options={{ title: "Voting Details" }}
          children={(props) => (
            <VotingDetails
              {...props}
              userVotes={userVotes}
              setUserVotes={setUserVotes}
              groupVotesByParty={groupVotesByParty}
            />
          )}
        />
      </Stack.Navigator>
    </View>
  );
}

const userData = {
  name: "John Doe",
  profileImage: "data/profile.png",
};

function ProfileScreen({ userVotes, data }) {
  const navigation = useNavigation();

  const partyScores = calculateAlignment(data, userVotes, groupVotesByParty);
  let alignedParty = "None";

  if (Object.keys(partyScores).length > 0) {
    alignedParty = Object.keys(partyScores).reduce(
      (a, b) => (partyScores[a] > partyScores[b] ? a : b),
      ""
    );
  }

  const VotingHistoryItem = ({ item, navigation }) => {
    const voting = data.find((v) => v.dok_id === item.dok_id);
    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("Vote", {
            screen: "VotingDetails",
            params: {
              votes: voting.votes,
              dok_id: voting.dok_id,
              votingName: voting.votingName,
              url: voting.votingURL,
            },
          });
        }}
      >
        <View style={{ padding: 10, borderBottomWidth: 1, borderColor: "#ccc" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{voting.votingName}</Text>
          <Text style={{ fontSize: 15, fontWeight: "bold", paddingTop: 5 }}>
            {voting.votes[0].datum}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "bold", paddingTop: 5 }}>{item.vote}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => <VotingHistoryItem item={item} navigation={navigation} />;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Image source={profileImage} style={{ width: 100, height: 100, borderRadius: 15 }} />
        <Text style={{ fontSize: 24, marginTop: 10 }}>{userData.name}</Text>
      </View>

      <View style={{ marginBottom: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", paddingBottom: 20 }}>
          You align the most with:
        </Text>
        <Image
          source={partyIcons[alignedParty.toLowerCase()]}
          style={{ width: 100, height: 100 }}
        />
      </View>

      <View>
        <Text style={{ fontSize: 18, fontWeight: "bold", alignSelf: "center" }}>
          Voting History:
        </Text>
        <FlatList
          style={{ paddingTop: 10 }}
          data={Object.entries(userVotes).map(([dok_id, vote]) => ({ dok_id, vote }))}
          renderItem={renderItem}
          keyExtractor={(item) => item.dok_id}
        />
      </View>
    </View>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    const parseCSV = async () => {
      const csvAsset = Asset.fromModule(require("./data/votings-final-updated.csv"));
      await csvAsset.downloadAsync();

      const csvContent = await fetch(csvAsset.uri).then((response) => response.text());

      Papa.parse(csvContent, {
        complete: (result) => {
          const groupByVoting = (data) => {
            return data.reduce((acc, curr) => {
              const key = curr.dok_id;
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(curr);
              return acc;
            }, {});
          };

          const groupedData = groupByVoting(result.data);

          const uniqueVotings = Object.keys(groupedData).map((key) => {
            return {
              dok_id: key,
              votingName: groupedData[key][0].votingName,
              votes: groupedData[key],
              votingURL: groupedData[key][0].votingURL,
            };
          });

          setData(uniqueVotings);
          setLoading(false);
        },
        header: true,
      });
    };

    parseCSV();
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Vote") {
            iconName = focused ? "checkbox" : "checkbox-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: "tomato",
        inactiveTintColor: "gray",
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vote">
        {(props) => (
          <VoteScreen
            {...props}
            data={data}
            userVotes={userVotes}
            setUserVotes={setUserVotes}
            groupVotesByParty={groupVotesByParty}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Profile">
        {(props) => (
          <ProfileScreen
            {...props}
            data={data}
            userVotes={userVotes}
            setUserVotes={setUserVotes}
            groupVotesByParty={groupVotesByParty}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
