import { articles } from "@/constants/articles";
import SportArticleView from "@/components/SportArticleView";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const article = articles.find((item) => item.id.toString() === id);

    if (!article) {
        return {
            title: "Article Not Found",
        };
    }

    return {
        title: `${article.title} | Kick Expert`,
        description: article.desc,
        openGraph: {
            title: article.title,
            description: article.desc,
            images: [article.image],
        },
    };
}

export async function generateStaticParams() {
    return articles.map((article) => ({
        id: article.id.toString(),
    }));
}

export default async function ArticlePage({ params }: PageProps) {
    const { id } = await params;
    const article = articles.find((item) => item.id.toString() === id);

    if (!article) {
        notFound();
    }

    return (
        <div className="bg-white">
            <Navbar />
            <SportArticleView article={article} />
            <Footer />
        </div>
    );
}
