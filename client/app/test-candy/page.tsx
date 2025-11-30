'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DeployStage } from './components/DeployStage'
import { InsertItemsStage } from './components/InsertItemsStage'
import { MintStage } from './components/MintStage'
import { getAllCandyMachines, deleteCandyMachine } from '@/lib/candy-machine-db'

type Stage = 'deploy' | 'insert' | 'mint'

export default function TestCandyMachinePage() {
  const [currentStage, setCurrentStage] = useState<Stage>('deploy')
  const [currentCandyMachineId, setCurrentCandyMachineId] = useState<string | null>(null)
  const [savedMachines, setSavedMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSavedMachines()
  }, [])

  const loadSavedMachines = async () => {
    const machines = await getAllCandyMachines()
    setSavedMachines(machines)
    setLoading(false)
  }

  const handleDeploySuccess = (id: string) => {
    setCurrentCandyMachineId(id)
    setCurrentStage('insert')
    loadSavedMachines()
  }

  const handleInsertSuccess = () => {
    setCurrentStage('mint')
    loadSavedMachines()
  }

  const handleLoadExisting = (id: string, stage: Stage) => {
    setCurrentCandyMachineId(id)
    setCurrentStage(stage)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this candy machine?')) {
      await deleteCandyMachine(id)
      if (currentCandyMachineId === id) {
        setCurrentCandyMachineId(null)
        setCurrentStage('deploy')
      }
      loadSavedMachines()
    }
  }

  const handleReset = () => {
    setCurrentCandyMachineId(null)
    setCurrentStage('deploy')
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">Candy Machine Test Flow</h1>
        <p className="text-gray-600">
          Complete end-to-end flow: Deploy → Insert Items → Mint NFTs
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <StageIndicator
            stage="deploy"
            label="Deploy"
            current={currentStage}
            completed={currentStage !== 'deploy'}
            onClick={() => currentCandyMachineId && setCurrentStage('deploy')}
          />
          <div className="flex-1 h-0.5 bg-gray-300 mx-4">
            <div
              className={`h-full transition-all ${
                currentStage !== 'deploy' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </div>
          <StageIndicator
            stage="insert"
            label="Insert Items"
            current={currentStage}
            completed={currentStage === 'mint'}
            onClick={() => currentCandyMachineId && setCurrentStage('insert')}
          />
          <div className="flex-1 h-0.5 bg-gray-300 mx-4">
            <div
              className={`h-full transition-all ${
                currentStage === 'mint' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </div>
          <StageIndicator
            stage="mint"
            label="Mint"
            current={currentStage}
            completed={false}
            onClick={() => currentCandyMachineId && setCurrentStage('mint')}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stage Area */}
        <div className="lg:col-span-2">
          {currentStage === 'deploy' && (
            <DeployStage onDeploySuccess={handleDeploySuccess} />
          )}

          {currentStage === 'insert' && currentCandyMachineId && (
            <InsertItemsStage
              candyMachineId={currentCandyMachineId}
              onInsertSuccess={handleInsertSuccess}
            />
          )}

          {currentStage === 'mint' && currentCandyMachineId && (
            <MintStage candyMachineId={currentCandyMachineId} />
          )}

          {currentCandyMachineId && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full mt-4"
            >
              Start New Candy Machine
            </Button>
          )}
        </div>

        {/* Sidebar - Saved Machines */}
        <div>
          <Card className="p-4">
            <h3 className="font-bold mb-4">Saved Candy Machines</h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : savedMachines.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No candy machines yet
              </p>
            ) : (
              <div className="space-y-3">
                {savedMachines.map((machine) => (
                  <Card
                    key={machine.id}
                    className={`p-3 cursor-pointer transition-all ${
                      machine.id === currentCandyMachineId
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm">
                      <div className="font-bold mb-1">{machine.name}</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Supply: {machine.supply}</div>
                        <div>
                          Status:{' '}
                          <span
                            className={
                              machine.deploymentStatus === 'deployed'
                                ? 'text-green-600'
                                : machine.deploymentStatus === 'failed'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }
                          >
                            {machine.deploymentStatus}
                          </span>
                        </div>
                        <div>
                          Items:{' '}
                          {machine.itemsInserted ? (
                            <span className="text-green-600">Inserted</span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-1"
                          onClick={() =>
                            handleLoadExisting(
                              machine.id,
                              !machine.itemsInserted ? 'insert' : 'mint'
                            )
                          }
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                          onClick={() => handleDelete(machine.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 mt-4 bg-gray-50">
            <h4 className="font-bold text-sm mb-2">Test Info</h4>
            <ul className="text-xs space-y-1 text-gray-700">
              <li>• Uses test manifest with 29 NFTs</li>
              <li>• Deployed via canister to Solana devnet</li>
              <li>• Data stored in browser IndexedDB</li>
              <li>• SOL payment guard enabled</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface StageIndicatorProps {
  stage: Stage
  label: string
  current: Stage
  completed: boolean
  onClick: () => void
}

function StageIndicator({ stage, label, current, completed, onClick }: StageIndicatorProps) {
  const isActive = current === stage
  const isClickable = completed || current === stage

  return (
    <div
      className={`flex flex-col items-center gap-2 ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
          isActive
            ? 'bg-blue-500 border-blue-500 text-white'
            : completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-white border-gray-300 text-gray-400'
        }`}
      >
        {completed ? <CheckCircle className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
      </div>
      <span
        className={`text-sm font-medium ${
          isActive ? 'text-blue-600' : completed ? 'text-green-600' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
