'use client'

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

let apolloClient

function createApolloClient() {
  const httpLink = new HttpLink({
    uri: 'http://localhost:8000/api/graphql/',
    credentials: 'include', // Send cookies with requests
  })

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    },
  })
}

export function useApollo() {
  if (!apolloClient) {
    apolloClient = createApolloClient()
  }
  return apolloClient
}
