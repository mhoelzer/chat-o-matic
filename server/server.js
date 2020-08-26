// bring in that server
const { GraphQLServer, PubSub } = require("graphql-yoga");

const messages = [];

// each graphql server needs a type; it's got a schema
// fields within message or query (gets messages)
// ! means field is required
// messages is key, and we'll get array of nessages
// [] means array of ___
// mutation means post
// postmessage takes a user as string
const typeDefs = `
	type Message {
		id: ID!
		user: String!
		content: String!
	}
	type Query {
		messages: [Message!]
	}
	type Mutation {
		postMessage(user: String!, content: String!): ID!
	}
	type Subscription {
		messages: [Message!]
	}
`;

// persistent list of who's subscribed
const subscribers = [];
const onMessagesUpdates = (funct) => subscribers.push(funct);

// how we actually get the data; we have types, so get data
// must match the keys
const resolvers = {
    Query: {
        messages: () => messages,
    },
    Mutation: {
        // partent whatever container is
        postMessage: (parent, { user, content }) => {
            const id = messages.length;
			messages.push({ id, user, content });
			subscribers.forEach((funct) => funct())
            return id;
        },
    },
    Subscription: {
        messages: {
            subscribe: (parent, args, { pubsub }) => {
                // make new random channel; get 0. off
                const channel = Math.random().toString(36).slice(2, 15);
                // you've shown and subscribed, so we will add you to it; calback does pubsub on channel
                onMessagesUpdates(() => pubsub.publish(channel, { messages }));
                // set timeout to send firrst time auuto
                setTimeout(() => pubsub.publish(channel, { messages }), 0);
                return pubsub.asyncIterator(channel);
            },
        },
    },
};

const pubsub = new PubSub();

// create it; passin typeDefs and how to get them
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
// takes callback and find that port
server.start(({ port }) => {
    console.log(`Server on http://localhost:${port}/`);
});

