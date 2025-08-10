"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function About() {
  const [aboutContent, setAboutContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const response = await fetch("/api/settings/about-me");
        const data = await response.json();
        setAboutContent(data.content || "");
      } catch (error) {
        console.error("Error fetching about content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAboutContent();
  }, []);

  return (
    <>
      <Navbar currentPath="/about" />

      <main className="container mx-auto px-4 py-8">
        <section className="about-header py-8">
          <h1 className="text-4xl font-bold mb-4 text-center">About me</h1>
        </section>

        <section className="about-content max-w-4xl mx-auto">
          <div className="container mx-auto py-12">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : aboutContent ? (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{aboutContent}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No about content available yet.
              </p>
            )}
          </div>

          <div className="cta-section text-center py-8">
            <h2 className="text-2xl font-semibold mb-6">
              Разгледайте произведенията
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/gallery"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
              >
                Галерия
              </Link>
              <Link
                href="/shop"
                className="bg-gray-800 text-white px-6 py-3 rounded-md hover:bg-gray-900 transition"
              >
                Онлайн магазин
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
