import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface CandyMachineDB extends DBSchema {
  'candy-machines': {
    key: string // collection_id
    value: {
      id: string
      name: string
      symbol: string
      supply: number
      mintPrice: number
      manifestUrl: string

      // Derived addresses
      payerAddress?: string
      candyMachineAddress?: string
      collectionMintAddress?: string

      // Deployment stage
      deploymentStatus: 'pending' | 'deploying' | 'deployed' | 'failed'
      deploymentTx?: string
      deploymentError?: string

      // Insert items stage
      itemsInserted: boolean
      itemsInsertTx?: string
      itemsInsertError?: string
      totalItems?: number

      // Timestamps
      createdAt: number
      updatedAt: number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<CandyMachineDB>> | null = null

export async function getCandyMachineDB() {
  if (!dbPromise) {
    dbPromise = openDB<CandyMachineDB>('candy-machine-test-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('candy-machines')) {
          db.createObjectStore('candy-machines', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveCandyMachine(data: CandyMachineDB['candy-machines']['value']) {
  const db = await getCandyMachineDB()
  await db.put('candy-machines', {
    ...data,
    updatedAt: Date.now(),
  })
}

export async function getCandyMachine(id: string) {
  const db = await getCandyMachineDB()
  return db.get('candy-machines', id)
}

export async function getAllCandyMachines() {
  const db = await getCandyMachineDB()
  return db.getAll('candy-machines')
}

export async function deleteCandyMachine(id: string) {
  const db = await getCandyMachineDB()
  await db.delete('candy-machines', id)
}

export async function updateCandyMachine(
  id: string,
  updates: Partial<CandyMachineDB['candy-machines']['value']>
) {
  const db = await getCandyMachineDB()
  const existing = await db.get('candy-machines', id)
  if (!existing) throw new Error('Candy machine not found')

  await db.put('candy-machines', {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  })
}
