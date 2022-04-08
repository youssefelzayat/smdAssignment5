import { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => { },
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items where done = ?;`,
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = doneHeading ? "Done! (Tap on the task to remove it)" : "Task (Tap on the task to tick it)";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, value }) => (
        <TouchableOpacity
          key={id}
          onPress={() => onPressItem && onPressItem(id)}
          style={{
            backgroundColor: done ? "white" : "#fff",
            borderColor: "black",
            borderWidth: 2,
            borderRadius: 10,
            padding: 10,
          }}
        >
          <Text style={{ color: done ? "black" : "#000" }}>{value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function App() {
  const [text, setText] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, done int, value text);"
      );
    });
  }, []);

  const add = (text) => {
    // is text empty?
    if (text === null || text === "") {
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (done, value) values (0, ?)", [text]);
        tx.executeSql("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null,
      forceUpdate
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Todo List</Text>

      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.flexRow}>
            <TextInput
              onChangeText={(text) => setText(text)}
              onSubmitEditing={() => {
                add(text);
                setText(null);
              }}
              placeholder="Write your tasks here!"
              style={styles.input}
              value={text}
            />
          </View>

          <ScrollView style={styles.listArea}>
            <ImageBackground
              source={require("./assets/todoAssignment5.jpg")}
              resizeMode="cover"
              style={{ flex: 1 }}
            >
              <Items
                key={`forceupdate-todo-${forceUpdateId}`}
                done={false}
                onPressItem={(id) =>
                  db.transaction(
                    (tx) => {
                      tx.executeSql(`update items set done = 1 where id = ?;`, [
                        id,
                      ]);
                    },
                    null,
                    forceUpdate
                  )
                }
              />

              <Items
                done
                key={`forceupdate-done-${forceUpdateId}`}
                onPressItem={(id) =>
                  db.transaction(
                    (tx) => {
                      tx.executeSql(`delete from items where id = ?;`, [id]);
                    },
                    null,
                    forceUpdate
                  )
                }
              />
            </ImageBackground>
          </ScrollView>

        </>
      )}
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 5,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",

  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "black",
    borderRadius: 10,
    borderWidth: 2,
    flex: 1,
    height: 45,
    margin: 25,
    padding: 12,
  },
  listArea: {
    flex: 1,
    paddingTop: 16,

  },
  sectionContainer: {
    marginBottom: 10,
    marginHorizontal: 20,

  },
  sectionHeading: {
    fontSize: 16,
    marginBottom: 14,


  },
});
