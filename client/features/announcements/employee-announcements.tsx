"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCompanyData } from "@/features/auth/demo-context";
import { formatDate } from "@/lib/dates";
import { fullName } from "@/lib/names";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function EmployeeAnnouncementsPage() {
  const { announcements, employees } = useCompanyData();
  const sorted = [...announcements].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div>
      <PageHeader title="Announcements" description="Updates published for your company only." />
      {sorted.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="No announcements" description="Your company has not published any updates yet." />
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((item) => {
            const author = employees.find((employee) => employee.id === item.authorId);
            return (
              <Link key={item.id} href={`/employee/announcements/${item.id}`}>
                <Card className="transition hover:border-indigo-200">
                  <CardBody>
                    <p className="text-base font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {author ? fullName(author) : "Company"} · {formatDate(item.publishedAt.slice(0, 10))}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{item.body}</p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function EmployeeAnnouncementDetail() {
  const params = useParams<{ id: string }>();
  const { announcements, employees } = useCompanyData();
  const item = announcements.find((announcement) => announcement.id === params.id);
  const author = employees.find((employee) => employee.id === item?.authorId);

  if (!item) {
    return (
      <div>
        <PageHeader title="Announcement" />
        <Card>
          <EmptyState icon={Bell} title="Not found" description="This announcement is not in your company workspace." />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={item.title}
        description={`${author ? fullName(author) : "Company"} · ${formatDate(item.publishedAt.slice(0, 10))}`}
        actions={
          <Link href="/employee/announcements" className="text-sm font-medium text-indigo-600">
            Back to list
          </Link>
        }
      />
      <Card>
        <CardBody>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.body}</p>
        </CardBody>
      </Card>
    </div>
  );
}
