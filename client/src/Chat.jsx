import React from "react";
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    useSubscription,
    gql,
    useMutation,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
// gql manages string templates with graphql stuff
import { Container, Row, Col, FormInput, Button, Form } from "shards-react";

const link = new WebSocketLink({
    // on 4000 since that's where erver is
    uri: `ws://localhost:4000/`,
    options: { reconnect: true },
});

const client = new ApolloClient({
    link,
    uri: "http://localhost:4000/",
    cache: new InMemoryCache(),
});

// this used to use query, but we change dto get subscritpion use
const GET_MESSAGES = gql`
    subscription {
        messages {
            id
            content
            user
        }
    }
`;

// $user/content will get from variables defined at top
const POST_MESSAGE = gql`
    mutation($user: String!, $content: String!) {
        postMessage(user: $user, content: $content)
    }
`;

const Messages = ({ user }) => {
    // this gives it time to reload; 500 mill; fix with substriction b/c it'd  do contantly
    const { data } = useSubscription(GET_MESSAGES);
    if (!data) {
        return null;
    }
    return (
        <React.Fragment>
            {data.messages.map(({ id, user: messageUser, content }) => (
                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            user === messageUser ? "flex-end" : "flex-start",
                        paddingBottom: "10px",
                    }}
                >
                    {user !== messageUser && (
                        <div
                            style={{
                                height: "50px",
                                width: "50px",
                                marginRight: "5px",
                                border: "3px dashed purple",
                                borderRadius: 25,
                                textAlign: "center",
                                fontSize: "24px",
                                paddingTop: 5,
                            }}
                        >
                            {messageUser.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div
                        style={{
                            background:
                                user === messageUser ? "orange" : "aqua",
                            color: user === messageUser ? "lime" : "black",
                            padding: "10px",
                            borderRadius: "10px",
                            maxWidth: "60%",
                        }}
                    >
                        {content}
                    </div>
                </div>
            ))}
        </React.Fragment>
    );
};

const Chat = () => {
    const [state, stateSet] = React.useState({
        user: "meee",
        content: "",
    });
    // since this gives back an array
    const [postMessage] = useMutation(POST_MESSAGE);
    // invoke by giving object
    const onSend = () => {
        if (state.content.length > 0) {
            // send state since user/content match
            postMessage({ variables: state });
        }
        // make the state blank after sending
        stateSet({ ...state, content: "" });
    };
    return (
        <Container>
            <Messages user={state.user} />
            <Row>
                <Col xs={2} style={{ padding: 0 }}>
                    <FormInput
                        label="User"
                        value={state.user}
                        onChange={(event) =>
                            stateSet({ ...state, user: event.target.value })
                        }
                    />
                </Col>
                <Col xs={8}>
                    <FormInput
                        label="Content"
                        value={state.content}
                        onChange={(event) =>
                            stateSet({ ...state, content: event.target.value })
                        }
                        onKeyUp={(event) => {
                            if (event.keyCode === 13) {
                                onSend();
                            }
                        }}
                    />
                </Col>
                <Col xs={2} style={{ padding: 0 }}>
                    <Button onClick={() => onSend()} style={{width: "100%", backgroundColor: "magenta"}}>Send</Button>
                </Col>
            </Row>
        </Container>
    );
};

export default () => (
    <ApolloProvider client={client}>
        <Chat />
    </ApolloProvider>
);
