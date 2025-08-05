"use client";

import { useState } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
    title: string;
    start: string;
    end: string;
}

const BigCalendar = ({ data }: { data: CalendarEvent[] }) => {
    const [view, setView] = useState<View>(Views.WORK_WEEK);

    const handleOnChangeView = (selectedView: View) => {
        setView(selectedView);
    };

    // Convert string dates to Date objects and filter out invalid events
    const events = data
        .map((event) => ({
            title: event.title,
            start: new Date(event.start),
            end: new Date(event.end),
        }))
        .filter((event) => !isNaN(event.start.getTime()) && !isNaN(event.end.getTime()));

    return (
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={["work_week", "day"]}
            view={view}
            onView={handleOnChangeView}
            style={{ height: "98%" }}
            min={new Date(2025, 1, 0, 8, 0, 0)}
            max={new Date(2025, 1, 0, 17, 0, 0)}
        />
    );
};

export default BigCalendar;