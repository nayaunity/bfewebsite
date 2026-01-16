import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface MailchimpError {
  status: number;
  title: string;
  detail?: string;
}

function getSubscriberHash(email: string): string {
  return crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
}

async function addTagsToSubscriber(
  email: string,
  tags: string[],
  apiKey: string,
  listId: string,
  server: string
): Promise<void> {
  if (!tags || tags.length === 0) return;

  const subscriberHash = getSubscriberHash(email);
  const url = `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}/tags`;

  const tagData = {
    tags: tags.map((tag) => ({ name: tag, status: "active" })),
  };

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `apikey ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tagData),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, tags } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;
    const server = process.env.MAILCHIMP_SERVER;

    if (!apiKey || !listId || !server) {
      console.error("Missing Mailchimp configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const url = `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members`;

    const data = {
      email_address: email,
      status: "subscribed",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `apikey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // Add tags after successful subscription
      await addTagsToSubscriber(email, tags, apiKey, listId, server);
      return NextResponse.json({ success: true, message: "Subscribed successfully!" });
    }

    const errorData = (await response.json()) as MailchimpError;

    // Handle "already subscribed" gracefully - still add/update tags
    if (response.status === 400 && errorData.title === "Member Exists") {
      await addTagsToSubscriber(email, tags, apiKey, listId, server);
      return NextResponse.json({
        success: true,
        message: "You're already subscribed!",
        alreadySubscribed: true,
      });
    }

    console.error("Mailchimp error:", errorData);
    return NextResponse.json(
      { error: errorData.detail || "Subscription failed" },
      { status: response.status }
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
