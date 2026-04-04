"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck } from "lucide-react";

type SubjectAttendance = {
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
};

type AttendanceOverviewProps = {
  attendance: SubjectAttendance[];
};

const AttendanceGauge = ({ percentage, colorClass }: { percentage: number, colorClass: string }) => {
  const radius = 40;
  const circumference = Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 50">
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/20"
          />
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end h-full pb-1">
            <span className={`text-3xl font-bold ${colorClass}`}>
                {percentage}%
            </span>
        </div>
      </div>
    </div>
  );
};

export default function AttendanceOverview({ attendance }: AttendanceOverviewProps) {
  const totalAttended = attendance.reduce((sum, item) => sum + item.attendedClasses, 0);
  const totalClasses = attendance.reduce((sum, item) => sum + item.totalClasses, 0);
  const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAttendeanceMessage = (percentage: number) => {
    if (percentage >= 75) return "You're on track! Keep it up.";
    if (percentage >= 60) return "Attend more classes to improve.";
    return "Urgent: Attendance critically low.";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5" />
          Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Attendance */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="bloc mb-2">
             <AttendanceGauge percentage={overallPercentage} colorClass={getAttendanceColor(overallPercentage)} />
             <p className="text-center text-xs text-muted-foreground mt-1">
               {getAttendeanceMessage(overallPercentage)}
             </p>
          </div>

          {/* Desktop Progress */}
          <div className=" md:block">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Attendance</span>
              <span className={`text-2xl font-bold ${getAttendanceColor(overallPercentage)}`}>
                {overallPercentage}%
              </span>
            </div>
            <Progress value={overallPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalAttended} / {totalClasses} classes attended
            </p>
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div className="space-y-3">
          {attendance.map((subject, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{subject.subjectName}</span>
                <span className={`text-sm font-semibold ${getAttendanceColor(subject.percentage)}`}>
                  {subject.percentage}%
                </span>
              </div>
              <Progress value={subject.percentage} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {subject.attendedClasses} / {subject.totalClasses} classes
              </p>
            </div>
          ))}
        </div>

        {overallPercentage < 75 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ Your attendance is below 75%. Please attend classes regularly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
