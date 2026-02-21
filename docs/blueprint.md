# **App Name**: ACET Platform

## Core Features:

- B2C Test Purchase: Integrate Paystack payment gateway to allow individual users to purchase the ACET test, updating the `Transactions` and `Users` collections on successful payment.
- Offline Test Engine: Implement an offline-first testing engine using Dexie.js to cache assessments locally and store results with `sync_status: 'pending'`.  A background process or a `<SyncManager />` tool detects when the browser returns online, synchronizing results from Dexie.js to Firestore and updating assessment logs.
- School Stakeholder Research (SSR) Form Builder: Develop a dynamic form builder to generate surveys based on JSON configurations. The builder should render questions and capture responses, tagging the `evaluator_role` (Parent, Student, Teacher) upon submission and save to firestore.
- Admin Dashboard: Develop a secure admin dashboard for school administrators to manage identity records, trigger surveys, and view analytics.
- User Authentication: Implement secure user authentication using Firebase Auth, with role-based access control to differentiate between B2C users, school admins, teachers, students, and parents.
- Data Synchronization: Implement a `<SyncManager />` tool that listens for the `window.addEventListener('online')` event and pushes pending logs to Firestore. The tool will manage online/offline mutations and use TanStack Query (React Query) to handle online/offline mutations.  It synchronizes data between the local Dexie.js database and Firestore when the application is online.
- AI-powered identity verification and matching: Utilize a tool that integrates with biometric data and/or RFID to suggest which record to match with which person, reducing manual matching of IDs with new students.

## Style Guidelines:

- Primary color: Dark Blue (#224292), for credibility, safety and intelligence.
- Background color: Light blue (#D1DDF2), slightly desaturated to complement the primary color.
- Accent color: Violet (#7A5599), approximately 30 degrees to the 'left' of the primary on the color wheel; chosen to create a vibrant contrast.
- Body text: 'PT Sans', a humanist sans-serif suitable for body text; Headings: 'Space Grotesk' sans-serif, best used for headlines and titles in limited lengths.
- Use modern, minimalist icons to represent different sections and actions within the platform.
- Maintain a clean, well-organized layout with clear visual hierarchy to enhance user experience.
- Implement subtle transitions and animations to provide feedback and guide users through workflows.