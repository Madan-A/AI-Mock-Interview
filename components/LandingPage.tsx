"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  BarChart3, 
  MessageSquare, 
  Zap,
  ArrowRight,
  ChevronDown,
  PlayCircle,
  TrendingUp,
  Users,
  Award,
  Clock,
  CheckCircle2,
  Star,
  Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingBackground from "./LandingBackground";

export default function LandingPage() {
  const features = [
    {
      icon: Sparkles,
      title: "Real-time AI Interview Simulation",
      description: "Practice with advanced AI that adapts to your responses and simulates real interview scenarios.",
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-300",
    },
    {
      icon: MessageSquare,
      title: "Personalized Feedback",
      description: "Get instant, detailed feedback on your answers, communication style, and interview performance.",
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-300",
    },
    {
      icon: BarChart3,
      title: "Detailed Performance Analytics",
      description: "Track your progress with comprehensive analytics and identify areas for improvement.",
      color: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-300",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up & Set Your Profile",
      description: "Create your account and customize your interview preferences, role, and tech stack.",
      icon: Users,
    },
    {
      number: "02",
      title: "Choose Interview Type",
      description: "Select from behavioral, technical, or coding interviews tailored to your goals.",
      icon: PlayCircle,
    },
    {
      number: "03",
      title: "Practice & Improve",
      description: "Engage in realistic AI-powered interviews and receive instant, actionable feedback.",
      icon: TrendingUp,
    },
    {
      number: "04",
      title: "Track Your Progress",
      description: "Monitor your performance with detailed analytics and watch your confidence grow.",
      icon: Award,
    },
  ];

  const stats = [
    { value: "95%", label: "User Satisfaction", icon: Star },
  { value: "<1 min", label: "Avg Feedback Time", icon: MessageSquare },
    { value: "24/7", label: "Available Practice", icon: Clock },
    { value: "Progress", label: "Assessment Insights", icon: BarChart3 },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      content: "MockMate helped me ace my interviews. The AI feedback is incredibly detailed and helped me identify areas I never knew needed work.",
      rating: 5,
    },
    {
      name: "Michael Rodriguez",
      role: "Frontend Developer",
      content: "The real-time interview simulation is mind-blowing. It feels like talking to a real interviewer. Highly recommend!",
      rating: 5,
    },
    {
      name: "Emily Johnson",
      role: "Product Manager",
      content: "The analytics dashboard shows exactly where I excel and where I need improvement. This is exactly what I needed!",
      rating: 5,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.42, 0, 0.58, 1] as const,
      },
    },
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <LandingBackground />
      
      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Animated Title */}
          <motion.div variants={itemVariants}>
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="block bg-gradient-to-r from-primary-100 via-primary-200 to-purple-400 bg-clip-text text-transparent animate-gradient">
                MOCKMATE
              </span>
            </motion.h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl md:text-3xl text-light-100 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Your personal AI interviewer to practice, improve, and excel in real interviews.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          >
            <Link href="/sign-up" className="group">
              <Button
                size="lg"
                className="relative px-8 py-6 text-lg font-bold bg-gradient-to-r from-primary-200 via-purple-400 to-purple-500 text-dark-100 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 overflow-hidden min-w-[180px]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Sign Up
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Button>
            </Link>

            <Link href="/sign-in" className="group">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-bold border-2 border-primary-200/50 text-primary-100 rounded-full backdrop-blur-sm bg-dark-200/30 hover:bg-dark-200/50 hover:border-primary-200 transition-all duration-300 hover:scale-105 min-w-[180px]"
              >
                <span className="flex items-center gap-2">
                  Login
                  <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </Button>
            </Link>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-2 text-primary-100/60 cursor-pointer"
            onClick={() => {
              const featuresSection = document.getElementById("features");
              featuresSection?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="text-sm font-medium">Learn More</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 sm:px-6 lg:px-8 py-20 pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-100 to-purple-400 bg-clip-text text-transparent">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-light-100/80 max-w-2xl mx-auto">
              Comprehensive tools designed to make you interview-ready
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="group relative"
                >
                  {/* Glassmorphism Card */}
                  <div className="relative h-full p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-dark-200/40 to-dark-300/40 border border-primary-100/20 shadow-2xl hover:shadow-primary-200/20 transition-all duration-500 hover:scale-105 hover:border-primary-200/40 overflow-hidden">
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="mb-6">
                        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-dark-200/60 to-dark-300/60 border border-primary-100/20 group-hover:border-primary-200/40 transition-all duration-300">
                          <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-primary-100 transition-colors duration-300">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-light-100/80 leading-relaxed group-hover:text-light-100 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>

                    {/* Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-dark-200/40 to-dark-300/40 border border-primary-100/20 backdrop-blur-xl mb-4 group-hover:border-primary-200/40 transition-all duration-300 group-hover:scale-110">
                    <Icon className="w-8 h-8 text-primary-200" />
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                    className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-100 to-purple-400 bg-clip-text text-transparent mb-2"
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-light-100/80 text-sm md:text-base">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-100 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-light-100/80 max-w-2xl mx-auto">
              Get interview-ready in four simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="group relative"
                >
                  <div className="relative h-full p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-dark-200/40 to-dark-300/40 border border-primary-100/20 shadow-2xl hover:shadow-primary-200/20 transition-all duration-500 hover:scale-105 hover:border-primary-200/40 overflow-hidden">
                    {/* Step Number */}
                    <div className="absolute top-4 right-4 text-6xl font-bold text-primary-100/10 group-hover:text-primary-100/20 transition-colors duration-300">
                      {step.number}
                    </div>

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="mb-6">
                        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-primary-100/20 group-hover:border-primary-200/40 transition-all duration-300">
                          <Icon className="w-8 h-8 text-primary-200" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary-100 transition-colors duration-300">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-light-100/80 leading-relaxed text-sm group-hover:text-light-100 transition-colors duration-300">
                        {step.description}
                      </p>
                    </div>

                    {/* Connecting Line (not for last item) */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary-200/50 to-transparent -translate-y-1/2 z-0">
                        <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/50" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-100 to-purple-400 bg-clip-text text-transparent">
              Loved by Thousands
            </h2>
            <p className="text-xl text-light-100/80 max-w-2xl mx-auto">
              See what our users are saying about their interview success
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group relative"
              >
                <div className="relative h-full p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-dark-200/40 to-dark-300/40 border border-primary-100/20 shadow-2xl hover:shadow-primary-200/20 transition-all duration-500 hover:scale-105 hover:border-primary-200/40">
                  {/* Quote Icon */}
                  <Quote className="absolute top-6 left-6 w-12 h-12 text-primary-200/20 group-hover:text-primary-200/40 transition-colors duration-300" />
                  
                  <div className="relative z-10 mt-4">
                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-primary-200 text-primary-200" />
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-light-100/90 leading-relaxed mb-6 italic">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="border-t border-primary-100/20 pt-4">
                      <p className="font-bold text-white">{testimonial.name}</p>
                      <p className="text-sm text-light-100/60">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-20 pb-32">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-12 md:p-16 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-dark-200/60 to-dark-300/60 border-2 border-primary-200/30 shadow-2xl text-center overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-100 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
                Ready to Ace Your Next Interview?
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xl text-light-100/90 mb-10 max-w-2xl mx-auto"
              >
                Join thousands of professionals who have transformed their interview skills with AI-powered practice.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6"
              >
                <Link href="/sign-up" className="group">
                  <Button
                    size="lg"
                    className="relative px-10 py-7 text-xl font-bold bg-gradient-to-r from-primary-200 via-purple-400 to-purple-500 text-dark-100 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 overflow-hidden min-w-[220px]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </Link>

                <Link href="/sign-in" className="group">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-10 py-7 text-xl font-bold border-2 border-primary-200/50 text-primary-100 rounded-full backdrop-blur-sm bg-dark-200/30 hover:bg-dark-200/50 hover:border-primary-200 transition-all duration-300 hover:scale-110 min-w-[220px]"
                  >
                    <span className="flex items-center gap-2">
                      Sign In
                      <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"></div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

