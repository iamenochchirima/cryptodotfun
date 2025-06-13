import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  BookOpen,
  Coins,
  Shield,
  Users,
  Sparkles,
  Layers,
  Rocket,
  Zap,
  Award,
  TrendingUp,
  MessageSquare,
  ImageIcon,
} from "lucide-react"
import { AnimatedHeroText } from "@/components/animated-hero-text"
import { useEffect } from "react"
import { dburl } from "./actions/db-actions"


export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-crypto-purple/20 via-background to-background" />
        <h1>Let me put this here</h1>
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            Your Crypto Hub: <AnimatedHeroText />
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            The ultimate crypto super app for learning, earning, trading, and connecting with the blockchain community.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/explore">
                Explore Features <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="text-3xl font-bold mb-2 crypto-gradient-text">50+</div>
              <div className="text-sm text-muted-foreground">Blockchain Courses</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="text-3xl font-bold mb-2 crypto-gradient-text">$10M+</div>
              <div className="text-sm text-muted-foreground">Trading Volume</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="text-3xl font-bold mb-2 crypto-gradient-text">100K+</div>
              <div className="text-sm text-muted-foreground">Community Members</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="text-3xl font-bold mb-2 crypto-gradient-text">25+</div>
              <div className="text-sm text-muted-foreground">Blockchain Networks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 md:text-4xl">All-in-One Crypto Platform</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              CryptoDotFun combines education, trading, security, and community in one seamless platform.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="crypto-card">
              <BookOpen className="mb-4 h-10 w-10 text-crypto-blue" />
              <h3 className="mb-2 text-xl font-bold">Learn</h3>
              <p className="mb-4 text-muted-foreground">
                Comprehensive blockchain courses from beginner to advanced levels.
              </p>
              <Button variant="link" className="p-0" asChild>
                <Link href="/learn">
                  Browse Courses <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="crypto-card">
              <Coins className="mb-4 h-10 w-10 text-crypto-yellow" />
              <h3 className="mb-2 text-xl font-bold">Earn</h3>
              <p className="mb-4 text-muted-foreground">
                Get rewarded with tokens for completing courses and contributing.
              </p>
              <Button variant="link" className="p-0" asChild>
                <Link href="/earn">
                  View Rewards <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="crypto-card">
              <Shield className="mb-4 h-10 w-10 text-crypto-green" />
              <h3 className="mb-2 text-xl font-bold">Secure</h3>
              <p className="mb-4 text-muted-foreground">
                Participate in security audits and bounties for blockchain projects.
              </p>
              <Button variant="link" className="p-0" asChild>
                <Link href="/secure">
                  Find Bounties <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="crypto-card">
              <Users className="mb-4 h-10 w-10 text-crypto-pink" />
              <h3 className="mb-2 text-xl font-bold">Connect</h3>
              <p className="mb-4 text-muted-foreground">Join a vibrant community with blogs, forums, and events.</p>
              <Button variant="link" className="p-0" asChild>
                <Link href="/connect">
                  Join Community <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Learn Section */}
      <section className="py-16 bg-gradient-to-r from-crypto-blue/5 to-crypto-purple/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div>
              <div className="inline-block mb-4 rounded-full bg-crypto-blue/10 px-3 py-1 text-sm font-medium text-crypto-blue">
                Learn
              </div>
              <h2 className="text-3xl font-bold mb-4 md:text-4xl">Master Blockchain Technology</h2>
              <p className="mb-6 text-muted-foreground">
                Our comprehensive learning platform offers courses on blockchain fundamentals, smart contract
                development, DeFi, NFTs, and more. Learn at your own pace with interactive content and hands-on
                projects.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-blue/20 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-crypto-blue" />
                  </div>
                  <span>50+ courses from beginner to advanced</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-blue/20 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-crypto-blue" />
                  </div>
                  <span>Interactive coding exercises</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-blue/20 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-crypto-blue" />
                  </div>
                  <span>Earn certificates and tokens</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-blue/20 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-crypto-blue" />
                  </div>
                  <span>Learn from industry experts</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/learn">
                  Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image src="/blockchain-learning-platform.png" alt="Learning Platform" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* NFT Marketplace Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1 relative h-[400px] rounded-lg overflow-hidden">
              <Image src="/nft-marketplace-digital-art.png" alt="NFT Marketplace" fill className="object-cover" />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-block mb-4 rounded-full bg-crypto-purple/10 px-3 py-1 text-sm font-medium text-crypto-purple">
                NFT Marketplace
              </div>
              <h2 className="text-3xl font-bold mb-4 md:text-4xl">Discover, Buy, and Sell NFTs</h2>
              <p className="mb-6 text-muted-foreground">
                Explore our curated NFT marketplace featuring digital art, collectibles, music, and more. Buy, sell, and
                trade NFTs across multiple blockchains with low fees and seamless transactions.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-purple/20 flex items-center justify-center">
                    <Layers className="h-3 w-3 text-crypto-purple" />
                  </div>
                  <span>Multi-chain NFT support</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-purple/20 flex items-center justify-center">
                    <Layers className="h-3 w-3 text-crypto-purple" />
                  </div>
                  <span>Low marketplace fees</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-purple/20 flex items-center justify-center">
                    <Layers className="h-3 w-3 text-crypto-purple" />
                  </div>
                  <span>Creator royalties</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-purple/20 flex items-center justify-center">
                    <Layers className="h-3 w-3 text-crypto-purple" />
                  </div>
                  <span>Exclusive drops and collections</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/nft/marketplace">
                  Explore NFTs <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Token Launchpad Section */}
      <section className="py-16 bg-gradient-to-r from-crypto-green/5 to-crypto-yellow/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div>
              <div className="inline-block mb-4 rounded-full bg-crypto-green/10 px-3 py-1 text-sm font-medium text-crypto-green">
                Token Launchpad
              </div>
              <h2 className="text-3xl font-bold mb-4 md:text-4xl">Launch Your Own Tokens</h2>
              <p className="mb-6 text-muted-foreground">
                Create and launch your own fungible tokens with our easy-to-use token launchpad. Set tokenomics,
                distribution, and vesting schedules with just a few clicks. No coding required.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-green/20 flex items-center justify-center">
                    <Rocket className="h-3 w-3 text-crypto-green" />
                  </div>
                  <span>No-code token creation</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-green/20 flex items-center justify-center">
                    <Rocket className="h-3 w-3 text-crypto-green" />
                  </div>
                  <span>Multiple blockchain support</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-green/20 flex items-center justify-center">
                    <Rocket className="h-3 w-3 text-crypto-green" />
                  </div>
                  <span>Customizable tokenomics</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-green/20 flex items-center justify-center">
                    <Rocket className="h-3 w-3 text-crypto-green" />
                  </div>
                  <span>Secure and audited contracts</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/tokens/launchpad">
                  Launch Token <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image src="/token-launchpad-platform.png" alt="Token Launchpad" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1 relative h-[400px] rounded-lg overflow-hidden">
              <Image src="/blockchain-security-platform.png" alt="Security Platform" fill className="object-cover" />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-block mb-4 rounded-full bg-crypto-yellow/10 px-3 py-1 text-sm font-medium text-crypto-yellow">
                Security
              </div>
              <h2 className="text-3xl font-bold mb-4 md:text-4xl">Security Audits & Bounties</h2>
              <p className="mb-6 text-muted-foreground">
                Participate in security audits and bounties to help make blockchain projects safer. Find
                vulnerabilities, submit reports, and earn rewards for your contributions to blockchain security.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-yellow/20 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-crypto-yellow" />
                  </div>
                  <span>High-value security bounties</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-yellow/20 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-crypto-yellow" />
                  </div>
                  <span>Smart contract auditing tools</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-yellow/20 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-crypto-yellow" />
                  </div>
                  <span>Reputation system for auditors</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-yellow/20 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-crypto-yellow" />
                  </div>
                  <span>Security training and certification</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/secure">
                  Explore Bounties <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 bg-gradient-to-r from-crypto-pink/5 to-crypto-purple/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div>
              <div className="inline-block mb-4 rounded-full bg-crypto-pink/10 px-3 py-1 text-sm font-medium text-crypto-pink">
                Community
              </div>
              <h2 className="text-3xl font-bold mb-4 md:text-4xl">Connect with Crypto Enthusiasts</h2>
              <p className="mb-6 text-muted-foreground">
                Join our vibrant community of blockchain enthusiasts, developers, and investors. Share knowledge,
                discuss trends, and collaborate on projects through our blogs, forums, and events.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-pink/20 flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 text-crypto-pink" />
                  </div>
                  <span>Active discussion forums</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-pink/20 flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 text-crypto-pink" />
                  </div>
                  <span>Community-written blogs</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-pink/20 flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 text-crypto-pink" />
                  </div>
                  <span>Virtual and in-person events</span>
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full bg-crypto-pink/20 flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 text-crypto-pink" />
                  </div>
                  <span>Networking opportunities</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/connect">
                  Join Community <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image src="/crypto-forum-blog.png" alt="Community Platform" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 md:text-4xl">Everything You Need in One Platform</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              CryptoDotFun brings together all the tools and resources you need for your crypto journey.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="crypto-card">
              <BookOpen className="mb-4 h-8 w-8 text-crypto-blue" />
              <h3 className="mb-2 text-lg font-bold">Educational Courses</h3>
              <p className="text-sm text-muted-foreground">
                Learn blockchain technology from beginner to advanced levels.
              </p>
            </div>
            <div className="crypto-card">
              <Award className="mb-4 h-8 w-8 text-crypto-purple" />
              <h3 className="mb-2 text-lg font-bold">Certifications</h3>
              <p className="text-sm text-muted-foreground">Earn verifiable certificates for completed courses.</p>
            </div>
            <div className="crypto-card">
              <Coins className="mb-4 h-8 w-8 text-crypto-yellow" />
              <h3 className="mb-2 text-lg font-bold">Token Rewards</h3>
              <p className="text-sm text-muted-foreground">Get rewarded with tokens for learning and contributing.</p>
            </div>
            <div className="crypto-card">
              <ImageIcon className="mb-4 h-8 w-8 text-crypto-pink" />
              <h3 className="mb-2 text-lg font-bold">NFT Marketplace</h3>
              <p className="text-sm text-muted-foreground">Buy, sell, and trade NFTs across multiple blockchains.</p>
            </div>
            <div className="crypto-card">
              <Rocket className="mb-4 h-8 w-8 text-crypto-green" />
              <h3 className="mb-2 text-lg font-bold">NFT Launchpad</h3>
              <p className="text-sm text-muted-foreground">Create and launch your own NFT collections easily.</p>
            </div>
            <div className="crypto-card">
              <TrendingUp className="mb-4 h-8 w-8 text-crypto-blue" />
              <h3 className="mb-2 text-lg font-bold">Token Launchpad</h3>
              <p className="text-sm text-muted-foreground">
                Launch your own fungible tokens with customizable tokenomics.
              </p>
            </div>
            <div className="crypto-card">
              <Shield className="mb-4 h-8 w-8 text-crypto-yellow" />
              <h3 className="mb-2 text-lg font-bold">Security Audits</h3>
              <p className="text-sm text-muted-foreground">Participate in security audits and earn bounties.</p>
            </div>
            <div className="crypto-card">
              <MessageSquare className="mb-4 h-8 w-8 text-crypto-purple" />
              <h3 className="mb-2 text-lg font-bold">Community Forums</h3>
              <p className="text-sm text-muted-foreground">
                Discuss and share knowledge with other crypto enthusiasts.
              </p>
            </div>
            <div className="crypto-card">
              <Zap className="mb-4 h-8 w-8 text-crypto-pink" />
              <h3 className="mb-2 text-lg font-bold">Events & Webinars</h3>
              <p className="text-sm text-muted-foreground">
                Attend virtual and in-person events with industry experts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="rounded-xl bg-gradient-to-r from-crypto-blue/20 via-crypto-purple/20 to-crypto-pink/20 p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to start your crypto journey?</h2>
              <p className="mb-8 text-xl text-muted-foreground">
                Join thousands of users already exploring the world of blockchain with CryptoDotFun.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/explore">
                    Explore Features <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
