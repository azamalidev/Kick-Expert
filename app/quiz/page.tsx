import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Quiz from "@/components/Quiz";
import { getQuizQuestions } from "@/app/actions/quiz";

export const dynamic = 'force-dynamic';

export default async function QuizPage() {
    const questions = await getQuizQuestions();

    return (
        <div>
            <Navbar />
            <Quiz initialQuestions={questions} />
            <Footer />
        </div>
    );
}
