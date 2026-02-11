export interface AVResource {
    name: string;
    address: string;
    phone: string;
    notes: string;
    triggers: string[];
}

export const AV_RESOURCES: AVResource[] = [
    {
        name: "Paving the Way Foundation",
        address: "44818 Fern Ave, Ste 105, Lancaster",
        phone: "(661) 522-4134",
        notes: "Justice-involved focus. Offers OSHA-10, Forklift, and Food Handlers certifications.",
        triggers: ["Unemployed", "Job Skills", "Justice Involved", "Parole", "Probation", "Trade Training", "Re-entry"]
    },
    {
        name: "Paving the Way Wellness",
        address: "1729 West Avenue J, Lancaster",
        phone: "(661) 522-4134",
        notes: "Behavioral health and linkage to medical care.",
        triggers: ["Mental Health", "Substance Use", "Wellness", "Behavioral Health"]
    },
    {
        name: "DOORS AV",
        address: "349-A E Ave K-6, Lancaster",
        phone: "", // Phone not provided in prompt, leaving blank or specific instruction needed
        notes: "Re-entry housing and legal support.",
        triggers: ["Justice Involved", "Parole", "Re-entry"]
    },
    {
        name: "Independent Living Center of Southern California (ILCSC)",
        address: "606 East Avenue K-4, Lancaster",
        phone: "(661) 942-9726",
        notes: "Disability advocacy and assistive tech. Peer advocacy, housing help.",
        triggers: ["Disability", "Physical Disability", "SSI", "Assistive Technology"]
    },
    {
        name: "Antelope Valley Community Clinic (AVCC)",
        address: "45104 10th St W, Lancaster",
        phone: "(661) 942-2391",
        notes: "Accepts sliding scale/uninsured. Full pharmacy and dental onsite.",
        triggers: ["Medical", "Dental", "Low Cost", "Uninsured", "Sliding Scale"]
    },
    {
        name: "High Desert MACC",
        address: "335-B E. Ave K-6, Lancaster",
        phone: "(661) 471-4860",
        notes: "24/7 Urgent Care and Mental Health Urgent Care. Walk-ins welcome.",
        triggers: ["Urgent Care", "Mental Health", "Crisis", "Trauma", "24/7"]
    },
    {
        name: "Antelope Valley Transit Authority (AVTA)",
        address: "42210 6th St West, Lancaster",
        phone: "(661) 945-9445",
        notes: "Provide app for discounted 'LIFE' TAP card; essential for low-income transit. DOR-funded bus passes.",
        triggers: ["Transportation", "No Vehicle", "Bus Pass", "Transit"]
    },
    {
        name: "SAVES (South Antelope Valley Emergency Services)",
        address: "1002 E. Ave Q-12, Palmdale",
        phone: "(661) 267-5191",
        notes: "Food distribution Mon–Thu. No documentation required for emergency food.",
        triggers: ["Food Insecurity", "Groceries", "Palmdale"]
    },
    {
        name: "Grace Resources",
        address: "45134 Sierra Hwy, Lancaster",
        phone: "(661) 940-5272",
        notes: "Hot meals, groceries, and anger management classes.",
        triggers: ["Food Insecurity", "Groceries", "Lancaster", "Clothing", "Anger Management"]
    },
    {
        name: "Mental Health America (MHA)",
        address: "506 W Jackman St, Lancaster",
        phone: "(661) 726-2850",
        notes: "Adults counseling, depression.",
        triggers: ["Mental Health", "Counseling", "Depression"]
    },
    {
        name: "AV Domestic Violence Council",
        address: "Confidential",
        phone: "(661) 945-4436",
        notes: "Survivors emergency shelter, abuse help.",
        triggers: ["Crisis", "Domestic Violence", "Abuse", "Shelter"]
    },
    {
        name: "AV Transition Resource Center",
        address: "1420 W. Avenue I, Lancaster",
        phone: "(661) 945-6761",
        notes: "Specific support for 'at-risk' or foster youth transition to adulthood (16-25).",
        triggers: ["Youth", "Foster", "Transitional Youth", "Under 25"]
    },
    {
        name: "Green Thumb AV",
        address: "1805 W Ave K",
        phone: "", // Phone not provided
        notes: "Youth support.",
        triggers: ["Youth"]
    }
];
