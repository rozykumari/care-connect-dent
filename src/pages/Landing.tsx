import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowRight, 
  Shield, 
  Heart, 
  Clock, 
  Award,
  Phone,
  MapPin,
  Mail,
  Star,
  CheckCircle2
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">D</span>
              </div>
              <span className="font-semibold text-foreground text-lg">DentaCare</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth" className="hidden sm:block">
                <Button size="sm">
                  Book Now
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Star className="h-4 w-4" />
                Trusted by 10,000+ Patients
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Your Smile,
                <br />
                <span className="text-gradient">Our Priority</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Experience exceptional dental care in a comfortable, modern environment. 
                Our expert team is dedicated to giving you the healthy, beautiful smile you deserve.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Book Appointment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Us
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
                <div>
                  <div className="text-3xl font-bold text-foreground">15+</div>
                  <div className="text-sm text-muted-foreground mt-1">Years Experience</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">10k+</div>
                  <div className="text-sm text-muted-foreground mt-1">Happy Patients</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground mt-1">Satisfaction</div>
                </div>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-border overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <Heart className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Quality Care</h3>
                    <p className="text-muted-foreground">Modern facilities & gentle treatment</p>
                  </div>
                </div>
              </div>
              
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 p-4 bg-card rounded-xl border border-border shadow-soft-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Open Today</div>
                    <div className="text-sm text-muted-foreground">9:00 AM - 6:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive dental care tailored to your needs
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: "General Dentistry", description: "Routine checkups, cleanings, and preventive care" },
              { icon: Shield, title: "Cosmetic Care", description: "Teeth whitening, veneers, and smile makeovers" },
              { icon: Clock, title: "Emergency Care", description: "Same-day appointments for urgent dental issues" },
              { icon: Award, title: "Specialized Treatment", description: "Root canals, extractions, and advanced procedures" },
            ].map((service, idx) => (
              <div 
                key={idx}
                className="p-6 bg-card rounded-xl border border-border card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Why Choose <span className="text-gradient">DentaCare</span>?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We combine advanced technology with compassionate care to deliver the best 
                dental experience. Our team of experienced professionals is committed to 
                your oral health and comfort.
              </p>
              
              <div className="space-y-4">
                {[
                  "State-of-the-art equipment and techniques",
                  "Experienced and friendly dental team",
                  "Comfortable and relaxing environment",
                  "Transparent pricing with no hidden fees"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/auth">
                <Button size="lg" className="mt-4">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl bg-primary/10 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold text-primary">15+</div>
                  <div className="text-sm text-muted-foreground mt-1">Years of Excellence</div>
                </div>
              </div>
              <div className="aspect-square rounded-2xl bg-success/10 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold text-success">24/7</div>
                  <div className="text-sm text-muted-foreground mt-1">Emergency Support</div>
                </div>
              </div>
              <div className="aspect-square rounded-2xl bg-warning/10 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold text-warning">100%</div>
                  <div className="text-sm text-muted-foreground mt-1">Sterilized Tools</div>
                </div>
              </div>
              <div className="aspect-square rounded-2xl bg-secondary flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold text-foreground">5★</div>
                  <div className="text-sm text-muted-foreground mt-1">Patient Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready for a Healthier Smile?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Book your appointment today and take the first step towards optimal oral health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Book Appointment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Phone className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground">We're here to help with any questions</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Phone</h3>
              <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
            </div>
            
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">hello@dentacare.com</p>
            </div>
            
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Location</h3>
              <p className="text-sm text-muted-foreground">123 Health Street</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-foreground">DentaCare</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 DentaCare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;