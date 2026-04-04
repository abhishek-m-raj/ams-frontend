"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck, TrendingUp, TrendingDown } from "lucide-react";

type ClassAttendance = {
  className: string;
  classCode: string;
  totalClasses: number;
  averageAttendance: number;
  trend: "up" | "down" | "stable";
};

type ClassAttendanceOverviewProps = {
  attendance: ClassAttendance[];
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

export default function ClassAttendanceOverview({ attendance }: ClassAttendanceOverviewProps) {
  const overallAverage = attendance.length > 0 
    ? Math.round(attendance.reduce((sum, item) => sum + item.averageAttendance, 0) / attendance.length) 
    : 0;

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAttendanceMessage = (percentage: number) => {
    if (percentage >= 75) return "Classes performing well!";
    if (percentage >= 60) return "Some classes need attention.";
    return "Multiple classes below threshold.";
  };

  const getTrendIcon = (trend: ClassAttendance["trend"]) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5" />
          Class Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Gauge */}
        <div className="flex flex-col items-center">
          <AttendanceGauge 
            percentage={overallAverage} 
            colorClass={getAttendanceColor(overallAverage)} 
          />
          <p className={`text-sm font-medium mt-2 ${getAttendanceColor(overallAverage)}`}>
            Overall Average: {overallAverage}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getAttendanceMessage(overallAverage)}
          </p>
        </div>

        {/* Per-Class Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Class-wise Performance</h4>
          {attendance.map((classItem, index) => {
            const percentage = classItem.averageAttendance;
            const colorClass = getAttendanceColor(percentage);

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{classItem.className}</span>
                    {getTrendIcon(classItem.trend)}
                  </div>
                  <span className={`font-semibold ${colorClass}`}>
                    {percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={percentage} 
                    className="flex-1 h-2" 
                  />
                  <span className="text-xs text-muted-foreground w-16">
                    {classItem.totalClasses} classes
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {classItem.classCode}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
