import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { RESOURCES, RESOURCE_CATEGORIES, type Resource } from "@/config/resources";

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{resource.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {resource.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(resource.url, "_blank", "noopener,noreferrer")}
        >
          {resource.ctaLabel || "Learn More"}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredResources = activeTab === "all" 
    ? RESOURCES 
    : RESOURCES.filter(r => r.category === activeTab);

  return (
    <div className="container py-8">
      <Link href="/">
        <a className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </a>
      </Link>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Resources & Partners</h1>
        </div>
        <p className="text-muted-foreground">
          Recommended tools, integrations, and services to enhance your FP&A workflow
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {activeTab !== "all" && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-1">
                {RESOURCE_CATEGORIES[activeTab as keyof typeof RESOURCE_CATEGORIES]?.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {RESOURCE_CATEGORIES[activeTab as keyof typeof RESOURCE_CATEGORIES]?.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No resources found in this category yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-8 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Want to be featured here?</CardTitle>
          <CardDescription>
            If you offer a product or service that complements MyFPnA, we'd love to hear from you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.open("mailto:partnerships@myfpna.com", "_blank")}>
            Contact Us
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>
          Note: Some links may be affiliate links. We only recommend products and services we believe
          add value to your FP&A workflow. Your support through these links helps us keep MyFPnA free.
        </p>
      </div>
    </div>
  );
}
