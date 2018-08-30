const mapUserData = ({
  followers_count,
  friends_count,
  ranking,
  statuses_count,
  createdAt,
  updatedAt,
  __v,
  _id,
  ...rest
}) => {
  const _ranking = ranking.$numberInt
    ? Number(ranking.$numberInt)
    : parseFloat(ranking.$numberDouble);
  return {
    followers_count: Number(followers_count.$numberInt),
    friends_count: Number(friends_count.$numberInt),
    statuses_count: Number(statuses_count.$numberInt),
    ranking: _ranking,
    ...rest
  };
};
export async function getFriends() {
  const getData = async () => {
    try {
      const response1 = await fetch('../data/sherlaimov-connections.json');
      const response2 = await fetch('../data/friends.json');
      const { connections } = await response1.json();
      const friends = await response2.json();
      const data = connections.map((connection, id) => {
        const { screen_name } = connection;
        const friendInfo = mapUserData(friends.find(friend => friend.screen_name === screen_name));

        return {
          ...connection,
          ...friendInfo,
          id: screen_name
        };
      });
      return data;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };
  const nodes = await getData();
  return nodes;
}

export async function getFollowers() {
  const getData = async () => {
    try {
      const response = await fetch('../data/followers.json');
      const data = await response.json();
      const followers = data.map(follower => {
        const followerData = mapUserData(follower);
        return {
          ...followerData,
          id: follower.screen_name
        };
      });
      return followers;
    } catch (e) {
      console.log(e);
      return undefined;
    }
  };
  const nodes = await getData();
  return nodes;
}
