'use client'

import './globals.css'
import { ApolloProvider } from '@apollo/client'
import { useApollo } from '../lib/apolloClient'
import { AuthProvider } from '../src/contexts/AuthContext'

export function Providers({ children }) {
  const client = useApollo()

  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ApolloProvider>
  )
}
