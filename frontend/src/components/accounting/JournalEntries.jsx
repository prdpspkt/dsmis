'use client'

import { useState } from 'react'
import { Table, Button, Modal, Badge } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { GET_ALL_JOURNAL_ENTRIES, GET_ALL_ACCOUNTS } from '../../graphql/accountingQueries'
import { formatDate, formatCurrency } from '../../utils/format'
import CreateJournalEntryModal from './CreateJournalEntryModal'

function JournalEntries({ onAccountClick }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)

  const { loading, data, refetch } = useQuery(GET_ALL_JOURNAL_ENTRIES)
  const { data: accountsData } = useQuery(GET_ALL_ACCOUNTS)

  const entries = data?.allJournalEntries || []
  const accounts = accountsData?.allAccounts || []

  const statusColors = {
    DRAFT: 'warning',
    POSTED: 'success',
    CANCELLED: 'danger'
  }

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry)
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Journal Entries</h5>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          New Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-journal-book display-4"></i>
          <p className="mt-3">No journal entries found</p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create First Entry
          </Button>
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Entry #</th>
                <th>Date</th>
                <th>Description</th>
                <th>Total Debit</th>
                <th>Total Credit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.entryNumber}</td>
                  <td>{formatDate(entry.date)}</td>
                  <td>{entry.description}</td>
                  <td>{formatCurrency(entry.totalDebit)}</td>
                  <td>{formatCurrency(entry.totalCredit)}</td>
                  <td>
                    <Badge bg={statusColors[entry.status]}>{entry.status}</Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleViewDetails(entry)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-secondary">
                <th colSpan={3}>Total</th>
                <th>{formatCurrency(entries.reduce((sum, e) => sum + (parseFloat(e.totalDebit) || 0), 0))}</th>
                <th>{formatCurrency(entries.reduce((sum, e) => sum + (parseFloat(e.totalCredit) || 0), 0))}</th>
                <th colSpan={2}></th>
              </tr>
            </tfoot>
          </Table>
        </>
      )}

      {/* View Details Modal */}
      <Modal show={!!selectedEntry} onHide={() => setSelectedEntry(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Entry {selectedEntry?.entryNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEntry && (
            <div>
              <Table size="sm">
                <tbody>
                  <tr>
                    <td width="200"><strong>Entry Number:</strong></td>
                    <td>{selectedEntry.entryNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>Date:</strong></td>
                    <td>{formatDate(selectedEntry.date)}</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td><Badge bg={statusColors[selectedEntry.status]}>{selectedEntry.status}</Badge></td>
                  </tr>
                  <tr>
                    <td><strong>Description:</strong></td>
                    <td>{selectedEntry.description}</td>
                  </tr>
                </tbody>
              </Table>

              <h6 className="mt-4">Entry Lines</h6>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Narration</th>
                    <th className="text-end">Debit</th>
                    <th className="text-end">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntry.lines?.map(line => (
                    <tr key={line.id}>
                      <td>{line.account?.code} - {line.account?.name}</td>
                      <td>{line.narration}</td>
                      <td className="text-end">
                        {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-'}
                      </td>
                      <td className="text-end">
                        {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="table-secondary">
                    <th colSpan={2}>Total</th>
                    <th className="text-end">{formatCurrency(selectedEntry.totalDebit)}</th>
                    <th className="text-end">{formatCurrency(selectedEntry.totalCredit)}</th>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Create Entry Modal */}
      <CreateJournalEntryModal
        show={showCreateModal}
        onHide={() => {
          setShowCreateModal(false)
          refetch()
        }}
        accounts={accounts}
      />
    </div>
  )
}

export default JournalEntries
