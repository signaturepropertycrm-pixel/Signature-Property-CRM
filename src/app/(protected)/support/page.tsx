
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Linkedin, Facebook, Twitter, Instagram } from 'lucide-react';
import { SubmitTicketForm } from '@/components/submit-ticket-form';


const faqs = [
  {
    question: 'How do I manage team members?',
    answer:
      "As an Admin, you can add, edit, or delete team members from the 'Team' page. You can also assign different roles (Admin, Editor, Agent) to control their access levels.",
  },
  {
    question: "How can I upgrade or change my subscription plan?",
    answer:
      "You can view and change your subscription plan by navigating to the 'Upgrade Plan' page from the sidebar menu. Here you can compare all available plans and choose the one that best fits your agency's needs.",
  },
  {
    question: 'Where can I see all system activities?',
    answer:
      "The 'Activities' page provides a complete log of all major actions taken within the system, such as adding properties, updating buyer statuses, and more. This page is accessible to Admins and Editors.",
  },
  {
    question: "How do I restore a deleted property or buyer?",
    answer:
      "Deleted items are moved to the 'Trash' page. From there, you can either restore them to their original state or delete them permanently. Access to the Trash is available for Admins and Editors.",
  },
];

export default function SupportPage() {

    const handleWhatsAppClick = () => {
        const phone = '923001234567'; // Replace with your support WhatsApp number
        const message = "Hello, I need support with SignatureCRM.";
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Support Center
        </h1>
        <p className="text-muted-foreground">
          Get help and find answers to your questions.
        </p>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                  Our support team will get back to you within 24 hours.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <SubmitTicketForm />
          </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button className="w-full" onClick={handleWhatsAppClick}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact via WhatsApp
                </Button>
                <p className="text-center text-xs text-muted-foreground">or email us at</p>
                <p className="text-center font-semibold">signaturepropertycrm@gmail.com</p>
                 <Separator />
                <div className="flex justify-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <a href="#" target="_blank" rel="noopener noreferrer"><Linkedin /></a>
                    </Button>
                     <Button variant="outline" size="icon" asChild>
                        <a href="#" target="_blank" rel="noopener noreferrer"><Facebook /></a>
                    </Button>
                     <Button variant="outline" size="icon" asChild>
                        <a href="#" target="_blank" rel="noopener noreferrer"><Twitter /></a>
                    </Button>
                     <Button variant="outline" size="icon" asChild>
                        <a href="#" target="_blank" rel="noopener noreferrer"><Instagram /></a>
                    </Button>
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
