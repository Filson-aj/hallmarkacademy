// prisma/seed.ts
import { PrismaClient, NewsCategory, NewsStatus, GalleryCategory } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

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

    const class1 = await prisma.class.upsert({
        where: { name: 'JSS 1 Diamond' },
        update: {},
        create: {
            name: 'JSS 1 Diamond',
            category: 'Diamond',
            level: 'JSS',
            capacity: 30,
        },
    });

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
        where: { id: class1.id },
        data: { formmasterid: teacher.id },
    });

    await prisma.student.upsert({
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
            classid: class1.id,
        },
    });

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
    console.log('Login credentials all have password: password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
