import { PrismaClient, NewsCategory, NewsStatus, GalleryCategory } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // hash a dev‐only default password
    const hashedPassword = await bcrypt.hash('password', 12);

    const school = await prisma.school.upsert({
        where: { email: 'info@hallmarkacademy.sch.ng' },
        update: {},
        create: {
            name: 'Hallmark Academy Lafia',
            subtitle: 'Excellence in Education',
            schooltype: 'SECONDARY',
            email: 'info@hallmarkacademy.sch.ng',
            phone: '+234-800-123-4567',
            address: '123 Education Lane, Lafia, Nasarawa State, Nigeria',
            contactperson: 'Dr. John Adamu',
            contactpersonphone: '+234-803-123-4567',
            contactpersonemail: 'principal@hallmarkacademy.sch.ng',
            youtube: 'https://youtube.com/@hallmarkacademy',
            facebook: 'https://facebook.com/hallmarkacademy',
            regnumbercount: 1000,
            regnumberprepend: 'HAL',
            regnumberappend: '2025',
            logo: '/assets/logo.png',
        },
    });

    const [superAdmin, management, admin] = await Promise.all([
        prisma.administration.upsert({
            where: { email: 'super@hallmarkacademy.sch.ng' },
            update: {},
            create: {
                username: 'superadmin',
                email: 'super@hallmarkacademy.sch.ng',
                password: hashedPassword,
                role: 'Super',
            },
        }),
        prisma.administration.upsert({
            where: { email: 'management@hallmarkacademy.sch.ng' },
            update: {},
            create: {
                username: 'management',
                email: 'management@hallmarkacademy.sch.ng',
                password: hashedPassword,
                role: 'Management',
            },
        }),
        prisma.administration.upsert({
            where: { email: 'admin@hallmarkacademy.sch.ng' },
            update: {},
            create: {
                username: 'admin',
                email: 'admin@hallmarkacademy.sch.ng',
                password: hashedPassword,
                role: 'Admin',
            },
        }),
    ]);

    const parent = await prisma.parent.upsert({
        where: { email: 'parent@hallmarkacademy.sch.ng' },
        update: {},
        create: {
            username: 'parent_user',
            title: 'Mr.',
            firstname: 'James',
            surname: 'Okafor',
            othername: 'Chukwu',
            birthday: new Date('1980-05-15'),
            bloodgroup: 'O+',
            gender: 'MALE',
            occupation: 'Engineer',
            religion: 'Christianity',
            state: 'Nasarawa',
            lga: 'Lafia',
            email: 'parent@hallmarkacademy.sch.ng',
            phone: '+234-805-123-4567',
            address: '456 Parent Street, Lafia, Nasarawa State',
            password: hashedPassword,
        },
    });

    // Create Classes
    const classes = await Promise.all([
        prisma.class.upsert({
            where: { name: 'JSS 1 Diamond' },
            update: {},
            create: {
                name: 'JSS 1 Diamond',
                category: 'Diamond',
                level: 'JSS',
                capacity: 30,
            },
        }),
        prisma.class.upsert({
            where: { name: 'JSS 2 Gold' },
            update: {},
            create: {
                name: 'JSS 2 Gold',
                category: 'Gold',
                level: 'JSS',
                capacity: 28,
            },
        }),
        prisma.class.upsert({
            where: { name: 'JSS 3 Platinum' },
            update: {},
            create: {
                name: 'JSS 3 Platinum',
                category: 'Platinum',
                level: 'JSS',
                capacity: 25,
            },
        }),
    ]);

    const teacher = await prisma.teacher.upsert({
        where: { email: 'teacher@hallmarkacademy.sch.ng' },
        update: {},
        create: {
            username: 'teacher_user',
            title: 'Mrs.',
            firstname: 'Sarah',
            surname: 'Johnson',
            othername: 'Grace',
            birthday: new Date('1985-08-20'),
            bloodgroup: 'A+',
            gender: 'FEMALE',
            state: 'Nasarawa',
            lga: 'Lafia',
            email: 'teacher@hallmarkacademy.sch.ng',
            phone: '+234-806-123-4567',
            address: '789 Teacher Avenue, Lafia, Nasarawa State',
            password: hashedPassword,
            schoolid: school.id,
        },
    });

    // attach form master to class
    await prisma.class.update({
        where: { id: classes[0].id },
        data: { formmasterid: teacher.id },
    });

    // Create Students
    const students = await Promise.all([
        prisma.student.upsert({
            where: { email: 'student@hallmarkacademy.sch.ng' },
            update: {},
            create: {
                username: 'student_user',
                admissionnumber: 'HAL001/2025',
                firstname: 'Michael',
                surname: 'Okafor',
                othername: 'Chukwuemeka',
                birthday: new Date('2010-03-10'),
                gender: 'MALE',
                religion: 'Christianity',
                studenttype: 'Day Student',
                house: 'Blue House',
                bloodgroup: 'O+',
                email: 'student@hallmarkacademy.sch.ng',
                phone: '+234-807-123-4567',
                address: '456 Parent Street, Lafia, Nasarawa State',
                state: 'Nasarawa',
                lga: 'Lafia',
                password: hashedPassword,
                parentid: parent.id,
                schoolid: school.id,
                classid: classes[0].id,
            },
        }),
        prisma.student.create({
            data: {
                username: 'student2@hallmarkacademy.sch.ng',
                admissionnumber: 'HAL002/2025',
                firstname: 'Blessing',
                surname: 'Adamu',
                othername: 'Grace',
                birthday: new Date('2009-07-22'),
                gender: 'FEMALE',
                religion: 'Christianity',
                studenttype: 'Day Student',
                house: 'Red House',
                bloodgroup: 'A+',
                email: 'student2@hallmarkacademy.sch.ng',
                phone: '+234-807-123-4568',
                address: '789 Student Avenue, Lafia, Nasarawa State',
                state: 'Nasarawa',
                lga: 'Lafia',
                password: hashedPassword,
                parentid: parent.id,
                schoolid: school.id,
                classid: classes[1].id,
            },
        }),
        prisma.student.create({
            data: {
                username: 'student3@hallmarkacademy.sch.ng',
                admissionnumber: 'HAL003/2025',
                firstname: 'David',
                surname: 'Ibrahim',
                othername: 'Musa',
                birthday: new Date('2008-12-05'),
                gender: 'MALE',
                religion: 'Islam',
                studenttype: 'Boarding Student',
                house: 'Green House',
                bloodgroup: 'B+',
                email: 'student3@hallmarkacademy.sch.ng',
                phone: '+234-807-123-4569',
                address: '321 Student Road, Lafia, Nasarawa State',
                state: 'Nasarawa',
                lga: 'Lafia',
                password: hashedPassword,
                parentid: parent.id,
                schoolid: school.id,
                classid: classes[2].id,
            },
        }),
    ]);

    const subjectData = [
        { name: 'Mathematics', category: 'Core' },
        { name: 'English Language', category: 'Core' },
        { name: 'Basic Science', category: 'Science' },
    ].map((d) => ({ ...d, schoolid: school.id }));

    await prisma.subject.createMany({
        data: subjectData,
        skipDuplicates: true,
    });

    // connect Teacher ↔ Subjects
    const createdSubjects = await prisma.subject.findMany({
        where: {
            schoolid: school.id,
            name: { in: subjectData.map((d) => d.name) },
        },
    });

    await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
            subjects: {
                connect: createdSubjects.map((s) => ({ id: s.id })),
            },
        },
    });

    // Create Lessons
    const lessons = await Promise.all([
        prisma.lesson.create({
            data: {
                name: 'Mathematics - Algebra',
                day: 'MONDAY',
                startTime: new Date('2025-01-20T08:00:00Z'),
                endTime: new Date('2025-01-20T09:00:00Z'),
                subjectid: createdSubjects[0].id,
                classid: classes[0].id,
                teacherid: teacher.id,
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'English - Grammar',
                day: 'TUESDAY',
                startTime: new Date('2025-01-21T09:00:00Z'),
                endTime: new Date('2025-01-21T10:00:00Z'),
                subjectid: createdSubjects[1].id,
                classid: classes[0].id,
                teacherid: teacher.id,
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Basic Science - Physics',
                day: 'WEDNESDAY',
                startTime: new Date('2025-01-22T10:00:00Z'),
                endTime: new Date('2025-01-22T11:00:00Z'),
                subjectid: createdSubjects[2].id,
                classid: classes[1].id,
                teacherid: teacher.id,
            },
        }),
    ]);

    // Create Attendance Records
    const attendanceRecords = [];
    const today = new Date();

    // Create attendance for the past 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        for (const student of students) {
            for (const lesson of lessons) {
                if (lesson.classid === student.classid) {
                    attendanceRecords.push({
                        date: date,
                        present: Math.random() > 0.1, // 90% attendance rate
                        studentId: student.id,
                        lessonId: lesson.id,
                    });
                }
            }
        }
    }

    await prisma.attendance.createMany({
        data: attendanceRecords,
    });

    // Create Events
    const events = [
        {
            title: 'Science Fair 2025',
            description: 'Annual science fair showcasing student innovations and experiments. All students are encouraged to participate.',
            startTime: new Date('2025-02-15T09:00:00Z'),
            endTime: new Date('2025-02-15T16:00:00Z'),
            classId: null, // School-wide event
        },
        {
            title: 'Mathematics Competition',
            description: 'Inter-class mathematics competition for JSS 1 students. Prizes for top performers.',
            startTime: new Date('2025-02-20T10:00:00Z'),
            endTime: new Date('2025-02-20T12:00:00Z'),
            classId: classes[0].id,
        },
        {
            title: 'Parent-Teacher Meeting',
            description: 'Monthly meeting to discuss student progress and academic performance.',
            startTime: new Date('2025-02-25T14:00:00Z'),
            endTime: new Date('2025-02-25T17:00:00Z'),
            classId: null,
        },
        {
            title: 'Sports Day Practice',
            description: 'Practice session for upcoming sports day events. All JSS 2 students to participate.',
            startTime: new Date('2025-02-28T08:00:00Z'),
            endTime: new Date('2025-02-28T11:00:00Z'),
            classId: classes[1].id,
        },
        {
            title: 'Career Guidance Session',
            description: 'Career guidance and counseling session for JSS 3 students preparing for senior secondary.',
            startTime: new Date('2025-03-05T13:00:00Z'),
            endTime: new Date('2025-03-05T15:00:00Z'),
            classId: classes[2].id,
        },
        {
            title: 'Cultural Day Celebration',
            description: 'Celebration of Nigerian cultural diversity with traditional dances, foods, and costumes.',
            startTime: new Date('2025-03-10T09:00:00Z'),
            endTime: new Date('2025-03-10T15:00:00Z'),
            classId: null,
        },
    ];

    await prisma.event.createMany({
        data: events,
    });

    // Create Announcements
    const announcements = [
        {
            title: 'New Academic Session Begins',
            description: 'The new academic session 2024/2025 has officially begun. All students are expected to be punctual and come prepared for learning.',
            date: new Date('2025-01-15T08:00:00Z'),
            classId: null,
        },
        {
            title: 'Uniform Policy Reminder',
            description: 'All JSS 1 students are reminded to adhere to the school uniform policy. Complete uniform is mandatory for all school activities.',
            date: new Date('2025-01-18T07:30:00Z'),
            classId: classes[0].id,
        },
        {
            title: 'Library Hours Extended',
            description: 'The school library will now be open until 6:00 PM on weekdays to accommodate students who wish to study after regular hours.',
            date: new Date('2025-01-20T12:00:00Z'),
            classId: null,
        },
        {
            title: 'JSS 2 Field Trip',
            description: 'JSS 2 students will be going on an educational field trip to the National Museum next Friday. Permission slips must be submitted by Wednesday.',
            date: new Date('2025-01-22T10:00:00Z'),
            classId: classes[1].id,
        },
        {
            title: 'Examination Timetable Released',
            description: 'The first term examination timetable for JSS 3 has been released. Students can collect their copies from the notice board.',
            date: new Date('2025-01-25T09:00:00Z'),
            classId: classes[2].id,
        },
        {
            title: 'PTA Meeting Scheduled',
            description: 'The Parent-Teacher Association meeting has been scheduled for next Saturday at 10:00 AM in the school hall. All parents are encouraged to attend.',
            date: new Date('2025-01-28T08:00:00Z'),
            classId: null,
        },
        {
            title: 'Health and Safety Protocol',
            description: 'New health and safety protocols have been implemented. All students must sanitize hands before entering classrooms.',
            date: new Date('2025-01-30T07:45:00Z'),
            classId: null,
        },
    ];

    await prisma.announcement.createMany({
        data: announcements,
    });

    const newsArticles = [
        {
            title: 'Hallmark Academy Wins Regional Science Fair',
            content: `Our students showcased exceptional talent at the regional science fair, bringing home multiple awards including first place in robotics and environmental science categories. The competition, held at the Nasarawa State University, featured over 50 schools from across the region.
  
        Our robotics team, led by JSS 3 students, designed an innovative waste sorting robot that impressed the judges with its efficiency and environmental impact. The environmental science project focused on water purification methods using locally available materials.
  
        Principal Dr. John Adamu expressed his pride in the students' achievements, stating, "This victory is a testament to our commitment to excellence in STEM education and the dedication of our students and teachers."
  
        The winning students will represent Nasarawa State at the national science fair scheduled for next month in Abuja.`,
            excerpt: 'Our students showcased exceptional talent at the regional science fair, bringing home multiple awards including first place in robotics and environmental science categories.',
            author: 'Dr. Sarah Johnson',
            category: NewsCategory.ACHIEVEMENT,
            status: NewsStatus.PUBLISHED,
            featured: true,
            image: '/assets/students2.jpg',
            readTime: 3,
            publishedAt: new Date('2025-01-15'),
        },
        {
            title: 'Annual Sports Day Highlights',
            content: `A day filled with enthusiasm and sportsmanship as students participated in various athletic events, breaking several school records and demonstrating incredible team spirit. The annual sports day, held at our school grounds, featured track and field events, team sports, and fun activities for all age groups.
  
        Notable achievements include:
        - New 100m sprint record set by JSS 2 student Blessing Adamu
        - Outstanding performance by our football team in the inter-house championship
        - Record participation with over 95% of students taking part in various events
  
        The event was graced by parents, alumni, and distinguished guests from the community. The Blue House emerged as the overall winner, followed closely by Red House and Green House.
  
        Sports Coordinator Coach Michael Brown commended all participants for their dedication and fair play throughout the competition.`,
            excerpt: 'A day filled with enthusiasm and sportsmanship as students participated in various athletic events, breaking several school records.',
            author: 'Coach Michael Brown',
            category: NewsCategory.SPORTS,
            status: NewsStatus.PUBLISHED,
            featured: false,
            image: '/assets/students.jpg',
            readTime: 4,
            publishedAt: new Date('2025-01-10'),
        },
        {
            title: 'New Digital Library Inauguration',
            content: `We proudly opened our state-of-the-art digital library, providing students with access to over 50,000 digital resources and interactive learning materials. The facility, equipped with modern computers and high-speed internet, represents a significant investment in our students' educational future.
  
        Features of the new digital library include:
        - 40 computer workstations with latest software
        - Access to international educational databases
        - Interactive learning platforms for all subjects
        - Quiet study areas and collaborative spaces
        - 24/7 online access to digital resources
  
        The inauguration ceremony was attended by the State Commissioner for Education, who praised the school's commitment to embracing technology in education.
  
        Librarian Emma Wilson noted, "This facility will revolutionize how our students access information and conduct research, preparing them for the digital age."`,
            excerpt: 'We proudly opened our state-of-the-art digital library, providing students with access to over 50,000 digital resources.',
            author: 'Librarian Emma Wilson',
            category: NewsCategory.FACILITIES,
            status: NewsStatus.PUBLISHED,
            featured: true,
            image: '/assets/class.jpg',
            readTime: 2,
            publishedAt: new Date('2025-01-05'),
        },
        {
            title: 'Art Exhibition: Creativity Unleashed',
            content: `Our budding artists displayed their masterpieces in an inspiring exhibition, reflecting the vibrant creativity and artistic talent nurtured at our academy. The exhibition, titled "Creativity Unleashed," featured works from students across all levels, showcasing various art forms including painting, sculpture, digital art, and mixed media.
  
        Highlights of the exhibition:
        - Over 100 artworks on display
        - Themes ranging from cultural heritage to environmental conservation
        - Interactive art installations created by senior students
        - Live art demonstrations and workshops
  
        The exhibition was opened by renowned local artist Chief Aminu Kano, who praised the quality and creativity of the students' work. Several pieces were selected for display at the upcoming Nasarawa State Cultural Festival.
  
        Art teacher Ms. Lisa Chen expressed her pride in the students' achievements and the growing interest in visual arts at the school.`,
            excerpt: 'Our budding artists displayed their masterpieces in an inspiring exhibition, reflecting the vibrant creativity and artistic talent.',
            author: 'Ms. Lisa Chen',
            category: NewsCategory.ARTS,
            status: NewsStatus.PUBLISHED,
            featured: false,
            image: '/assets/student.jpg',
            readTime: 3,
            publishedAt: new Date('2024-12-20'),
        },
        {
            title: 'STEM Workshop Series Launch',
            content: `Launching our comprehensive STEM workshop series designed to enhance students' skills in science, technology, engineering, and mathematics through hands-on learning. The workshop series, running throughout the academic year, features expert facilitators and industry professionals.
  
        Workshop topics include:
        - Robotics and Automation
        - Environmental Engineering
        - Computer Programming and App Development
        - Renewable Energy Systems
        - Biotechnology and Genetics
  
        The program aims to inspire students to pursue STEM careers and develop critical thinking skills essential for the 21st century. Each workshop combines theoretical knowledge with practical applications, allowing students to work on real-world projects.
  
        The series is supported by partnerships with local universities and technology companies, providing students with exposure to cutting-edge research and career opportunities.`,
            excerpt: 'Launching our comprehensive STEM workshop series designed to enhance students\' skills through hands-on learning.',
            author: 'Prof. David Martinez',
            category: NewsCategory.EDUCATION,
            status: NewsStatus.PUBLISHED,
            featured: false,
            image: '/assets/students2.jpg',
            readTime: 5,
            publishedAt: new Date('2024-12-15'),
        },
    ];
    await prisma.news.createMany({
        data: newsArticles,
        skipDuplicates: true,
    });

    const galleryImages = [
        {
            title: 'School Main Building',
            description: 'Our beautiful main academic building housing classrooms and administrative offices',
            imageUrl: '/assets/class.jpg',
            category: GalleryCategory.FACILITIES,
            order: 1,
        },
        {
            title: 'Students in Science Lab',
            description: 'Students conducting experiments in our well-equipped science laboratory',
            imageUrl: '/assets/students2.jpg',
            category: GalleryCategory.STUDENTS,
            order: 2,
        },
        {
            title: 'Sports Day Activities',
            description: 'Annual sports day showcasing our students\' athletic abilities',
            imageUrl: '/assets/students.jpg',
            category: GalleryCategory.EVENTS,
            order: 3,
        },
        {
            title: 'Graduation Ceremony',
            description: 'Proud graduates celebrating their achievements',
            imageUrl: '/assets/student.jpg',
            category: GalleryCategory.ACHIEVEMENTS,
            order: 4,
        },
        {
            title: 'School Logo',
            description: 'Official Hallmark Academy logo',
            imageUrl: '/assets/logo.png',
            category: GalleryCategory.LOGO,
            order: 1,
        },
        {
            title: 'Hero Carousel Image 1',
            description: 'Students engaged in collaborative learning',
            imageUrl: '/assets/students2.jpg',
            category: GalleryCategory.CAROUSEL,
            order: 1,
        },
        {
            title: 'Hero Carousel Image 2',
            description: 'Modern classroom environment',
            imageUrl: '/assets/class.jpg',
            category: GalleryCategory.CAROUSEL,
            order: 2,
        },
        {
            title: 'Hero Carousel Image 3',
            description: 'Students participating in extracurricular activities',
            imageUrl: '/assets/students.jpg',
            category: GalleryCategory.CAROUSEL,
            order: 3,
        },
    ];
    await prisma.gallery.createMany({
        data: galleryImages,
        skipDuplicates: true,
    });

    await prisma.term.upsert({
        where: { id: 'current-term' },
        update: {},
        create: {
            id: 'current-term',
            start: new Date('2024-09-15'),
            end: new Date('2024-12-20'),
            nextterm: new Date('2025-01-15'),
            daysopen: 70,
            session: '2024/2025',
            term: 'First',
            status: 'Active',
        },
    });

    console.log('✅ Seed completed successfully!');
    console.log('Login credentials all have password: password');
    console.log('📧 Email addresses:');
    console.log('Super Admin: super@hallmarkacademy.sch.ng');
    console.log('Management: management@hallmarkacademy.sch.ng');
    console.log('Admin: admin@hallmarkacademy.sch.ng');
    console.log('Teacher: teacher@hallmarkacademy.sch.ng');
    console.log('Student: student@hallmarkacademy.sch.ng');
    console.log('Parent: parent@hallmarkacademy.sch.ng');
    console.log('📊 Mock data created:');
    console.log(`- ${attendanceRecords.length} attendance records`);
    console.log(`- ${events.length} events`);
    console.log(`- ${announcements.length} announcements`);
    console.log(`- ${newsArticles.length} news articles`);
    console.log(`- ${galleryImages.length} gallery images`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });