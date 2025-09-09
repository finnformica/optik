"use client";

import { inviteTeamMember, removeTeamMember } from "@/app/(login)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TeamDataWithMembers, User } from "@/lib/db/schema";
import { customerPortalAction } from "@/lib/payments/actions";
import { Loader2, PlusCircle } from "lucide-react";
import { Suspense, useActionState } from "react";
import useSWR from "swr";

type ActionState = {
  error?: string;
  success?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionSkeleton() {
  return (
    <Card className="mb-8 h-[140px] bg-[#1a2236] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Team Subscription</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ManageSubscription() {
  const { data: teamData } = useSWR<TeamDataWithMembers>("/api/team", fetcher);

  return (
    <Card className="mb-8 bg-[#1a2236] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Team Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <p className="font-medium text-white">
                Current Plan: {teamData?.planName || "Free"}
              </p>
              <p className="text-sm text-gray-400">
                {teamData?.subscriptionStatus === "active"
                  ? "Billed monthly"
                  : teamData?.subscriptionStatus === "trialing"
                  ? "Trial period"
                  : "No active subscription"}
              </p>
            </div>
            <form action={customerPortalAction}>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Manage Subscription
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembersSkeleton() {
  return (
    <Card className="mb-8 h-[140px] bg-[#1a2236] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4 mt-1">
          <div className="flex items-center space-x-4">
            <div className="size-8 rounded-full bg-gray-700"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-700 rounded"></div>
              <div className="h-3 w-14 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembers() {
  const { data: teamData } = useSWR<TeamDataWithMembers>("/api/team", fetcher);
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, {});

  const getUserDisplayName = (user: Pick<User, "id" | "name" | "email">) => {
    return user.name || user.email || "Unknown User";
  };

  if (!teamData?.teamMembers?.length) {
    return (
      <Card className="mb-8 bg-[#1a2236] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">No team members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 bg-[#1a2236] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {teamData.teamMembers.map((member, index) => (
            <li key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-gray-700 text-white">
                    {getUserDisplayName(member.user)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">
                    {getUserDisplayName(member.user)}
                  </p>
                  <p className="text-sm text-gray-400 capitalize">
                    {member.role}
                  </p>
                </div>
              </div>
              {index > 1 ? (
                <form action={removeAction}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={isRemovePending}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    {isRemovePending ? "Removing..." : "Remove"}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
        {removeState?.error && (
          <p className="text-red-400 mt-4">{removeState.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InviteTeamMemberSkeleton() {
  return (
    <Card className="h-[260px] bg-[#1a2236] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Invite Team Member</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InviteTeamMember() {
  const { data: user } = useSWR<User>("/api/user", fetcher);
  const isOwner = user?.role === "owner";
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  return (
    <Card className="bg-[#1a2236] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Invite Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2 text-white">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
              disabled={!isOwner}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label className="text-white">Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!isOwner}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem
                  value="member"
                  id="member"
                  className="border-gray-600 text-white"
                />
                <Label htmlFor="member" className="text-white">
                  Member
                </Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem
                  value="owner"
                  id="owner"
                  className="border-gray-600 text-white"
                />
                <Label htmlFor="owner" className="text-white">
                  Owner
                </Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <p className="text-red-400">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-green-400">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isInvitePending || !isOwner}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Member
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && (
        <CardFooter>
          <p className="text-sm text-gray-400">
            You must be a team owner to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <section className="flex-1">
      <h1 className="text-xl font-semibold text-white mb-4">Team Settings</h1>
      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      <Suspense fallback={<TeamMembersSkeleton />}>
        <TeamMembers />
      </Suspense>
      <Suspense fallback={<InviteTeamMemberSkeleton />}>
        <InviteTeamMember />
      </Suspense>
    </section>
  );
}
