import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { BarChart3, Brain, FileSpreadsheet, Heart, LineChart, TrendingUp, CheckCircle2, ArrowRight, Play } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [showDemo, setShowDemo] = useState(false);

  const handleSignIn = () => {
    window.location.href = getLoginUrl();
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-50 border-b">
        <div className="flex items-center gap-3">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
          <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Features
          </button>
          <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-gray-900 transition-colors">
            How It Works
          </button>
          <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-gray-900 transition-colors">
            FAQ
          </button>
          <Button variant="ghost" onClick={handleSignIn}>
            Sign In
          </Button>
          <Button onClick={handleSignIn}>
            Get Started Free
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
          🎉 Start your free trial • Sign in with Google, Microsoft, Apple, or Email
        </div>
        <h2 className="text-6xl font-bold text-gray-900 mb-6">
          Financial Planning & Analysis
          <br />
          <span className="text-blue-600">Powered by AI</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create budgets, generate AI-powered forecasts, and analyze variances with enterprise-grade FP&A tools designed for modern finance teams. No credit card required.
        </p>
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button size="lg" onClick={handleSignIn} className="text-lg px-8 py-6">
            Start Planning Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => setShowDemo(!showDemo)} className="text-lg px-8 py-6">
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
        
        {/* Demo Section */}
        {showDemo && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold mb-4">See MyFPnA Suite in Action</h3>
            <div className="bg-gray-100 rounded-lg p-8 mb-4">
              <p className="text-gray-600 mb-4">Watch how easy it is to:</p>
              <ul className="text-left space-y-2 max-w-md mx-auto">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Create budget scenarios in seconds
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Generate AI-powered forecasts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Analyze variances with interactive charts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Export professional reports
                </li>
              </ul>
            </div>
            <Button onClick={handleSignIn}>Try It Now - It's Free!</Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Sign in with OAuth
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Free forever
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h3 className="text-4xl font-bold text-center mb-4">Everything You Need for Financial Planning</h3>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Professional FP&A tools that help you make data-driven financial decisions with confidence.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => scrollToSection('how-it-works')}>
            <CardHeader>
              <FileSpreadsheet className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Scenario Planning</CardTitle>
              <CardDescription>
                Create multiple budget scenarios and compare outcomes for better decision-making.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0">Learn more →</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => scrollToSection('how-it-works')}>
            <CardHeader>
              <Brain className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>AI Forecasting</CardTitle>
              <CardDescription>
                Generate intelligent forecasts powered by OpenAI to predict future financial performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0">Learn more →</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => scrollToSection('how-it-works')}>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Variance Analysis</CardTitle>
              <CardDescription>
                Track budget vs. actuals with real-time variance calculations and visual dashboards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0">Learn more →</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => scrollToSection('how-it-works')}>
            <CardHeader>
              <LineChart className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Interactive Analytics</CardTitle>
              <CardDescription>
                Visualize your financial data with interactive charts, trends, and KPI dashboards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0">Learn more →</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => scrollToSection('how-it-works')}>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Reports & Export</CardTitle>
              <CardDescription>
                Generate professional reports and export data to Excel/CSV for stakeholder presentations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0">Learn more →</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/donate'}>
            <CardHeader>
              <Heart className="h-12 w-12 text-pink-600 mb-4" />
              <CardTitle>Donation-Based</CardTitle>
              <CardDescription>
                Free to use with optional donations to support continued development and hosting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0">Support now →</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-bold text-center mb-4">Get Started in 3 Simple Steps</h3>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            From sign-up to your first forecast in minutes, not hours.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-xl font-bold mb-2">Sign In</h4>
              <p className="text-gray-600 mb-4">
                Create your account with Manus OAuth - secure, fast, and no password required.
              </p>
              <Button variant="outline" size="sm" onClick={handleSignIn}>Sign In Now</Button>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-xl font-bold mb-2">Create Scenario</h4>
              <p className="text-gray-600 mb-4">
                Set up your first budget scenario with line items, categories, and time periods.
              </p>
              <Button variant="outline" size="sm" disabled>After Sign In</Button>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-xl font-bold mb-2">Analyze & Forecast</h4>
              <p className="text-gray-600 mb-4">
                Use AI-powered forecasting and analytics to make data-driven financial decisions.
              </p>
              <Button variant="outline" size="sm" disabled>After Setup</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <h3 className="text-4xl font-bold text-center mb-4">Frequently Asked Questions</h3>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Everything you need to know about MyFPnA Suite.
        </p>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How do I create an account?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Simply click "Get Started Free" and you'll be redirected to our secure sign-in page. Choose your preferred method: Google, Microsoft, Apple, or Email. If it's your first time, your account will be created automatically. No separate registration needed!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Is MyFPnA Suite really free?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Yes! MyFPnA Suite is completely free to use with no credit card required. We offer a free tier with full access to all core features. If you find value in the platform, you can optionally support us with a donation to help cover hosting and development costs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How does AI forecasting work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our AI forecasting uses OpenAI's advanced language models to analyze your historical budget data and generate intelligent predictions for future periods. The AI considers trends, patterns, and variances to provide accurate forecasts with confidence scores.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Can I export my data?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Absolutely! You can export your scenarios, budgets, and reports to Excel (XLSX) or CSV format at any time. Your data belongs to you, and we make it easy to share with stakeholders or use in other tools.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Is my financial data secure?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Yes. We use industry-standard security practices including encrypted connections (HTTPS), secure authentication via Manus OAuth, and isolated database storage. Your financial data is private and only accessible to you and your organization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Can multiple team members collaborate?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Currently, each account is individual. Team collaboration features are on our roadmap. If you need multi-user access, please reach out via the Resources page to discuss your requirements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What if I need help or have questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Check out our Resources page for helpful guides and tutorials. You can also support the project with a donation, which helps us continue improving the platform and providing support.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold mb-4">Ready to Transform Your Financial Planning?</h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join finance professionals using MyFPnA Suite for smarter budgeting and forecasting.
          </p>
          <Button size="lg" variant="secondary" onClick={handleSignIn} className="text-lg px-8 py-6">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              © 2025 {APP_TITLE}. Built with ❤️ for finance teams.
            </p>
            <div className="flex items-center gap-6">
              <a href="/resources" className="hover:text-white transition-colors">
                Resources
              </a>
              <a href="/donate" className="hover:text-white transition-colors">
                Donate
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
