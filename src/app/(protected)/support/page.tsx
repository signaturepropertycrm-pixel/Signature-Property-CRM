
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
import { MessageSquare } from 'lucide-react';
import { SubmitTicketForm } from '@/components/submit-ticket-form';


const faqs = [
  {
    question: 'How do I add a new property?',
    answer:
      "To add a new property, navigate to the 'Properties' page from the sidebar and click the 'Add Property' button. Fill in the required details in the form that appears and click 'Save Property'.",
  },
  {
    question: 'How can I change my password?',
    answer:
      "You can change your password by going to the 'Settings' page. Under the 'Security' section, you'll find fields to enter your current and new passwords. Click 'Update Password' to save the changes.",
  },
  {
    question: 'What is the difference between an Agent and an Editor?',
    answer:
      'An Agent can view all data like properties and buyers but cannot add new ones. An Editor has more permissions; they can add and edit properties and buyers, and also access the Activities and Trash pages.',
  },
  {
    question: "I can't see the 'Team' or 'Settings' pages. Why?",
    answer:
      "Access to 'Team' and 'Settings' pages is restricted to users with the 'Admin' role. If you need access, please contact your system administrator.",
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
                <p className="text-center font-semibold">SignaturePropertyCRM@gmail.com</p>
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
