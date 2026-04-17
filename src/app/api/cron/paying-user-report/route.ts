import { NextRequest, NextResponse } from "next/server";
import { buildDailyReport, formatReportText, formatReportHtml } from "@/lib/paying-user-report";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 60;

const REPORT_TO = "theblackfemaleengineer@gmail.com";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await buildDailyReport();

  const subject = `Daily Report: ${report.activeCount} paying user${report.activeCount === 1 ? "" : "s"}, ${report.totalApplied} apps sent, ${report.successRate}% success`;
  const text = formatReportText(report);
  const html = formatReportHtml(report);

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Naya <naya@theblackfemaleengineer.com>",
    replyTo: "theblackfemaleengineer@gmail.com",
    to: REPORT_TO,
    subject,
    text,
    html,
  });

  console.log(`[paying-user-report] Sent: ${report.activeCount} active, ${report.totalApplied} applied, ${report.successRate}% success`);
  return NextResponse.json({
    sent: true,
    activeUsers: report.activeCount,
    totalApplied: report.totalApplied,
    successRate: report.successRate,
    flags: report.flags.length,
  });
}
