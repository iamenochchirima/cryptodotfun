"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Coins, Shield, Users, ArrowRight, Trophy, TrendingUp } from "lucide-react"

// Mock user data
const userData = {
  address: "0x1234...5678",
  tokens: 120,
  coursesEnrolled: 3,
  coursesCompleted: 1,
  activeBounties: 2,
  blogPosts: 1,
}

// Mock courses data
const enrolledCourses = [
  {
    id: 1,
    title: "Introduction to Blockchain",
    progress: 75,
    image: "/blockchain-intro-concept.png",
  },
  {
    id: 2,
    title: "Solidity for Ethereum",
    progress: 30,
    image: "/coding-the-blockchain.png",
  },
  {
    id: 3,
    title: "DeFi Protocols Explained",
    progress: 10,
    image: "/defi-learning-journey.png",
  },
]

// Mock bounties data
const activeBounties = [
  {
    id: 1,
    title: "Ethereum DeFi Audit",
    reward: 5000,
    deadline: "2023-12-31",
    image: "/secure-defi-flow.png",
  },
  {
    id: 2,
    title: "NFT Marketplace Security Review",
    reward: 3000,
    deadline: "2023-11-15",
    image: "/secure-nft-marketplace.png",
  },
]

// Mock activity data
const recentActivity = [
  {
    id: 1,
    type: "course",
    title: "Completed Module: Consensus Mechanisms",
    date: "2 days ago",
    reward: 10,
  },
  {
    id: 2,
    type: "bounty",
    title: "Submitted Audit Report: Ethereum DeFi Protocol",
    date: "1 week ago",
    reward: 25,
  },
  {
    id: 3,
    type: "blog",
    title: "Published: Understanding Layer 2 Solutions",
    date: "2 weeks ago",
    reward: 15,
  },
]

export default function DashboardPage() {
  const [isConnected, setIsConnected] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Add this useEffect hook to handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return a loading state or null while not mounted
  if (!mounted) {
    return <div className="container mx-auto px-4 py-24">Loading dashboard...</div>
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center px-4 py-24">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">Connect Your Wallet</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Please connect your wallet to access your personalized dashboard.
          </p>
          <Button size="lg" onClick={() => setIsConnected(true)}>
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Your Dashboard</h1>
        <p className="text-lg text-muted-foreground">Track your progress, rewards, and activities</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData.coursesCompleted}/{userData.coursesEnrolled}
            </div>
            <p className="text-xs text-muted-foreground">Courses completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Bounties</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.activeBounties}</div>
            <p className="text-xs text-muted-foreground">Bounties in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Earned Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.tokens} $CDF</div>
            <p className="text-xs text-muted-foreground">Total tokens earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Community Activity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.blogPosts}</div>
            <p className="text-xs text-muted-foreground">Blog posts published</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="learning">
        <TabsList className="mb-8">
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="bounties">Bounties</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Learning Tab */}
        <TabsContent value="learning">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Enrolled Courses</CardTitle>
                <CardDescription>Continue learning where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={course.image || "/placeholder.svg"}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{course.title}</h3>
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-1" />
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/learn/${course.id}`}>Continue</Link>
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/learn">
                      Explore More Courses <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Achievements</CardTitle>
                <CardDescription>Certificates and badges you've earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">Complete courses to earn certificates</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Your achievements will appear here as you complete courses and earn certifications.
                  </p>
                  <Button asChild>
                    <Link href="/learn">Start Learning</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bounties Tab */}
        <TabsContent value="bounties">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Bounties</CardTitle>
                <CardDescription>Security bounties you're participating in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeBounties.map((bounty) => (
                    <div key={bounty.id} className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={bounty.image || "/placeholder.svg"}
                          alt={bounty.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{bounty.title}</h3>
                        <div className="mt-1 flex items-center gap-4 text-xs">
                          <span className="text-crypto-green">${bounty.reward} USDC</span>
                          <span className="text-muted-foreground">Deadline: {bounty.deadline}</span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/secure/${bounty.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/secure">
                      Find More Bounties <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auditor Reputation</CardTitle>
                <CardDescription>Your security auditing performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center justify-center">
                  <div className="relative h-32 w-32">
                    <div className="absolute inset-0 flex items-center justify-center rounded-full border-4 border-primary">
                      <div className="text-center">
                        <div className="text-3xl font-bold">85</div>
                        <div className="text-xs text-muted-foreground">Reputation</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-crypto-green" />
                      <span className="text-sm">Vulnerabilities Found</span>
                    </div>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-crypto-blue" />
                      <span className="text-sm">Accuracy Rate</span>
                    </div>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-crypto-yellow" />
                      <span className="text-sm">Ranking</span>
                    </div>
                    <span className="font-medium">Top 15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Token Balance</CardTitle>
                <CardDescription>Your earned $CDF tokens and rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 text-center">
                  <div className="text-4xl font-bold">{userData.tokens} $CDF</div>
                  <p className="text-sm text-muted-foreground">Total tokens earned</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-medium">Token Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">From courses</span>
                        <span className="font-medium">50 $CDF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">From bounties</span>
                        <span className="font-medium">45 $CDF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">From blogs</span>
                        <span className="font-medium">25 $CDF</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button className="flex-1">Stake Tokens</Button>
                    <Button variant="outline" className="flex-1">
                      Transfer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reward Opportunities</CardTitle>
                <CardDescription>Ways to earn more $CDF tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-1 font-medium">Complete Courses</h3>
                    <p className="mb-2 text-sm text-muted-foreground">Earn up to 20 $CDF per course completion</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/learn">Browse Courses</Link>
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-1 font-medium">Participate in Bounties</h3>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Earn $CDF tokens for successful security audits
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/secure">Find Bounties</Link>
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-1 font-medium">Write Blog Posts</h3>
                    <p className="mb-2 text-sm text-muted-foreground">Earn 10-25 $CDF for quality content</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/connect">Start Writing</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        activity.type === "course"
                          ? "bg-crypto-blue/10 text-crypto-blue"
                          : activity.type === "bounty"
                            ? "bg-crypto-green/10 text-crypto-green"
                            : "bg-crypto-purple/10 text-crypto-purple"
                      }`}
                    >
                      {activity.type === "course" ? (
                        <BookOpen className="h-5 w-5" />
                      ) : activity.type === "bounty" ? (
                        <Shield className="h-5 w-5" />
                      ) : (
                        <Users className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <Coins className="h-3 w-3" />+{activity.reward} $CDF
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
