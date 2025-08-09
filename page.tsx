"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Bot, Database, Mail, Settings, User, Globe, CheckCircle, Clock, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserData {
  name: string
  email: string
  phone: string
  address: string
}

interface FormSubmission {
  id: string
  url: string
  timestamp: Date
  status: "pending" | "success" | "failed"
  screenshot?: string
}

export default function FormFillerApp() {
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [formUrl, setFormUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [message, setMessage] = useState("")

  // Load user data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("formFillerUserData")
    if (savedData) {
      setUserData(JSON.parse(savedData))
    }

    const savedSubmissions = localStorage.getItem("formSubmissions")
    if (savedSubmissions) {
      setSubmissions(
        JSON.parse(savedSubmissions).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        })),
      )
    }
  }, [])

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("formFillerUserData", JSON.stringify(userData))
  }, [userData])

  // Save submissions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("formSubmissions", JSON.stringify(submissions))
  }, [submissions])

  const handleUserDataChange = (field: keyof UserData, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const isUserDataComplete = () => {
    return Object.values(userData).every((value) => value.trim() !== "")
  }

  const handleFillForm = async () => {
    if (!formUrl.trim()) {
      setMessage("Please enter a form URL")
      return
    }

    if (!isUserDataComplete()) {
      setMessage("Please complete all user information fields")
      return
    }

    setIsProcessing(true)
    setMessage("")

    const submissionId = Date.now().toString()
    const newSubmission: FormSubmission = {
      id: submissionId,
      url: formUrl,
      timestamp: new Date(),
      status: "pending",
    }

    setSubmissions((prev) => [newSubmission, ...prev])

    try {
      // Call the form filling API
      const response = await fetch("/api/fill-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formUrl,
          userData: userData,
          submissionId: submissionId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submissionId ? { ...sub, status: "success", screenshot: result.screenshot } : sub,
          ),
        )
        setMessage("Form filled successfully! Screenshot has been sent to your email.")
        setFormUrl("")
      } else {
        setSubmissions((prev) => prev.map((sub) => (sub.id === submissionId ? { ...sub, status: "failed" } : sub)))
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setSubmissions((prev) => prev.map((sub) => (sub.id === submissionId ? { ...sub, status: "failed" } : sub)))
      setMessage("An error occurred while processing the form")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (status: FormSubmission["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <X className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: FormSubmission["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            Smart Form Filler
          </h1>
          <p className="text-gray-600">Automatically fill web forms with your stored information</p>
        </div>

        <Tabs defaultValue="fill-form" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fill-form" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Fill Form
            </TabsTrigger>
            <TabsTrigger value="user-data" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              User Data
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fill-form" className="space-y-6">
            {/* Form Filling Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Fill Web Form
                </CardTitle>
                <CardDescription>
                  Enter a form URL and I'll automatically fill it with your stored information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-url">Form URL</Label>
                  <Input
                    id="form-url"
                    type="url"
                    placeholder="https://example.com/contact-form"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                {!isUserDataComplete() && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please complete your user information in the User Data tab before filling forms.
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleFillForm} disabled={isProcessing || !isUserDataComplete()} className="w-full">
                  {isProcessing ? "Processing..." : "Fill Form"}
                </Button>

                {message && (
                  <Alert
                    className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                  >
                    <AlertDescription className={message.includes("Error") ? "text-red-800" : "text-green-800"}>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Successful Fills</p>
                      <p className="text-2xl font-bold text-green-600">
                        {submissions.filter((s) => s.status === "success").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {submissions.filter((s) => s.status === "pending").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Forms</p>
                      <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="user-data" className="space-y-6">
            {/* User Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
                <CardDescription>Store your information to automatically fill forms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={userData.name}
                      onChange={(e) => handleUserDataChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={userData.email}
                      onChange={(e) => handleUserDataChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={userData.phone}
                      onChange={(e) => handleUserDataChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="123 Main St, City, State 12345"
                      value={userData.address}
                      onChange={(e) => handleUserDataChange("address", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={isUserDataComplete() ? "default" : "secondary"}>
                      {isUserDataComplete() ? "Complete" : "Incomplete"}
                    </Badge>
                    {isUserDataComplete() && <span className="text-sm text-green-600">Ready to fill forms!</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Submission History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Form Submission History
                </CardTitle>
                <CardDescription>View all your form submissions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No form submissions yet</p>
                    <p className="text-sm">Fill your first form to see history here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(submission.status)}
                            <span className="font-medium truncate max-w-md">{submission.url}</span>
                          </div>
                          <Badge className={getStatusColor(submission.status)}>{submission.status}</Badge>
                        </div>
                        <div className="text-sm text-gray-500">{submission.timestamp.toLocaleString()}</div>
                        {submission.screenshot && (
                          <div className="text-sm text-blue-600">Screenshot available - sent to email</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Tools Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Additional Tools
            </CardTitle>
            <CardDescription>Extra features to enhance your form filling experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <Mail className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Email Settings</div>
                  <div className="text-sm text-gray-500">Configure email notifications</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <Database className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-gray-500">Download your form data</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <Settings className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Advanced Settings</div>
                  <div className="text-sm text-gray-500">Customize form filling behavior</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
