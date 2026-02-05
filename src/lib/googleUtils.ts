export const generateGoogleCalendarLink = (event: {
    title: string;
    details: string;
    location?: string;
    start: Date;
    end?: Date;
}) => {
    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    // Default duration 1 hour if no end date
    const startDate = formatDate(event.start);
    const endDate = event.end ? formatDate(event.end) : formatDate(new Date(event.start.getTime() + 60 * 60 * 1000));

    const params = new URLSearchParams({
        text: event.title,
        dates: `${startDate}/${endDate}`,
        details: event.details,
        location: event.location || ""
    });

    return `${baseUrl}&${params.toString()}`;
};

export const generateGmailLink = (email: {
    to: string;
    subject: string;
    body?: string;
}) => {
    const baseUrl = "https://mail.google.com/mail/?view=cm&fs=1";
    const params = new URLSearchParams({
        to: email.to,
        su: email.subject,
        body: email.body || ""
    });

    return `${baseUrl}&${params.toString()}`;
};
