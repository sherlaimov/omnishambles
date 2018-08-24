const prepareFriendData = ({
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
    ...rest,
  };
};
export default async function getFriends() {
  const getData = async () => {
    try {
      const response1 = await fetch('../data/sherlaimov-connections.json');
      const response2 = await fetch('../data/friends.json');
      const { connections } = await response1.json();
      const friends = await response2.json();
      const data = connections.map((connection, id) => {
        const { screen_name } = connection;
        const friendInfo = prepareFriendData(
          friends.find(friend => friend.screen_name === screen_name)
        );

        return {
          ...connection,
          ...friendInfo,
          id: screen_name,
        };
      });
      const sherlaimov = prepareFriendData(friends.find(user => user.screen_name === 'sherlaimov'));
      sherlaimov.id = 'sherlaimov';
      data.push(sherlaimov);
      return data;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };
  const nodes = await getData();
  const links = nodes.map(({ id }) => ({ target: id, source: 'sherlaimov' }));
  return { nodes, links };
}
