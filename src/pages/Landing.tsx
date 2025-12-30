import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowRight, 
  Shield, 
  Heart, 
  Clock, 
  Award,
  Leaf,
  Sparkles,
  Phone,
  MapPin,
  Mail
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-sapphire flex items-center justify-center glow-sapphire-subtle">
                <span className="text-primary-foreground font-bold text-sm">DC</span>
              </div>
              <div>
                <span className="font-display font-semibold text-foreground tracking-tight text-lg">DentaCare</span>
                <span className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Medical Sanctuary</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</a>
              <a href="#experience" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Experience</a>
              <a href="#physicians" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Physicians</a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="hidden sm:flex">
                  Book Consultation
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background with gradient overlay simulating luxury atrium */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        
        {/* Decorative elements - Warm lighting effect */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/3 rounded-full blur-[150px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs uppercase tracking-widest">
                  <Leaf className="h-3 w-3" />
                  Biophilic Wellness
                </div>
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.1]">
                <span className="text-foreground">Where Healing</span>
                <br />
                <span className="text-gradient">Meets Sanctuary</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Experience medicine reimagined. Our private medical sanctuary offers personalized care in an environment designed for profound healing and restoration.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto group">
                    Begin Your Journey
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Phone className="mr-2 h-4 w-4" />
                  Schedule a Call
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="pt-8 border-t border-border/30">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="font-display text-3xl font-semibold text-foreground">15+</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Years Excellence</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-semibold text-foreground">10k+</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Patients Served</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-semibold text-foreground">98%</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Satisfaction Rate</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual Card - Representing the luxury atrium */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden premium-card gradient-border">
                {/* Simulated luxury interior visual */}
                <div className="aspect-[4/5] bg-gradient-to-br from-secondary via-card to-secondary/50 relative">
                  {/* Warm ambient lighting */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-amber-500/5" />
                  
                  {/* Interior elements simulation */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    {/* Waterfall/fountain visual element */}
                    <div className="w-32 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-t-full blur-sm animate-pulse" />
                    
                    {/* Plant silhouettes */}
                    <div className="absolute bottom-0 left-8 w-16 h-32 bg-emerald-800/20 rounded-t-full blur-sm" />
                    <div className="absolute bottom-0 right-8 w-20 h-40 bg-emerald-700/15 rounded-t-full blur-sm" />
                    <div className="absolute bottom-0 left-1/4 w-12 h-24 bg-emerald-900/20 rounded-t-full blur-sm" />
                    
                    {/* Timber ceiling beams effect */}
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-amber-950/20 to-transparent">
                      <div className="flex justify-around h-full opacity-30">
                        <div className="w-4 h-full bg-amber-900/30" />
                        <div className="w-4 h-full bg-amber-900/30" />
                        <div className="w-4 h-full bg-amber-900/30" />
                        <div className="w-4 h-full bg-amber-900/30" />
                      </div>
                    </div>
                    
                    {/* Stone texture overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-stone-500/5 via-transparent to-stone-600/5" />
                    
                    {/* Central text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-8 bg-background/60 backdrop-blur-xl rounded-xl border border-border/30">
                        <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
                        <h3 className="font-display text-xl font-medium text-foreground mb-2">Private Atrium</h3>
                        <p className="text-sm text-muted-foreground">Soaring timber ceilings,<br />Italian Travertine, natural light</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Warm cove lighting glow */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
                </div>
              </div>
              
              {/* Floating accent card */}
              <div className="absolute -bottom-6 -left-6 p-4 bg-card/90 backdrop-blur-xl rounded-xl border border-border/50 shadow-luxury">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-sapphire flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Holistic Care</div>
                    <div className="text-xs text-muted-foreground">Mind, body & spirit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card/50 text-xs uppercase tracking-widest text-muted-foreground mb-6">
              <Award className="h-3 w-3" />
              Our Services
            </div>
            <h2 className="font-display text-3xl lg:text-5xl font-semibold tracking-tight mb-4">
              Precision Medicine,
              <span className="text-gradient"> Personalized</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              For those who demand the definitive standard in global healthcare. 
              Every aspect of your care is tailored to your unique needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: "Comprehensive Care",
                description: "Full-spectrum dental and medical services under one sanctuary roof"
              },
              {
                icon: Shield,
                title: "Private Suites",
                description: "Exclusive treatment rooms designed for comfort and confidentiality"
              },
              {
                icon: Clock,
                title: "Priority Access",
                description: "24/7 concierge services and same-day appointments"
              },
              {
                icon: Sparkles,
                title: "Advanced Technology",
                description: "Cutting-edge diagnostics with minimal intervention philosophy"
              }
            ].map((service, idx) => (
              <div 
                key={idx}
                className="group p-6 premium-card rounded-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-medium text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card/50 text-xs uppercase tracking-widest text-muted-foreground mb-6">
                  <Leaf className="h-3 w-3" />
                  The Experience
                </div>
                <h2 className="font-display text-3xl lg:text-5xl font-semibold tracking-tight mb-4">
                  A New Standard in
                  <span className="text-gradient"> Medical Wellness</span>
                </h2>
              </div>
              
              <p className="text-muted-foreground text-lg leading-relaxed">
                Step into our sanctuary where the boundaries between healing space and luxury retreat dissolve. 
                Our biophilic design philosophy creates an environment where recovery is accelerated through 
                connection with nature.
              </p>
              
              <div className="space-y-4">
                {[
                  "Curated tropical gardens throughout the facility",
                  "Natural Italian Travertine and reclaimed timber finishes",
                  "Private suites with panoramic nature views",
                  "Dedicated wellness concierge for each guest"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/auth">
                <Button size="lg" className="group">
                  Experience the Difference
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {/* Visual representation */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-xl premium-card overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-emerald-900/30 via-emerald-800/20 to-emerald-900/30 flex items-end p-4">
                      <span className="text-xs uppercase tracking-widest text-emerald-300/80">Tropical Gardens</span>
                    </div>
                  </div>
                  <div className="aspect-square rounded-xl premium-card overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-amber-900/30 via-amber-800/20 to-amber-900/30 flex items-end p-4">
                      <span className="text-xs uppercase tracking-widest text-amber-300/80">Warm Lighting</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-xl premium-card overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-stone-700/30 via-stone-600/20 to-stone-700/30 flex items-end p-4">
                      <span className="text-xs uppercase tracking-widest text-stone-300/80">Travertine Stone</span>
                    </div>
                  </div>
                  <div className="aspect-[3/4] rounded-xl premium-card overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20 flex items-end p-4">
                      <span className="text-xs uppercase tracking-widest text-primary/80">Water Features</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto px-6 lg:px-8 relative text-center">
          <h2 className="font-display text-3xl lg:text-5xl font-semibold tracking-tight mb-6">
            Begin Your Journey to
            <span className="text-gradient"> Optimal Wellness</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Experience healthcare reimagined. Schedule a private consultation and discover 
            the difference of personalized, sanctuary-based medicine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto group">
                Schedule Consultation
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Phone className="mr-2 h-4 w-4" />
              +1 (800) DENTCARE
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg gradient-sapphire flex items-center justify-center glow-sapphire-subtle">
                  <span className="text-primary-foreground font-bold text-sm">DC</span>
                </div>
                <div>
                  <span className="font-display font-semibold text-foreground tracking-tight text-lg">DentaCare</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                A private medical sanctuary offering personalized care in an environment 
                designed for profound healing and restoration.
              </p>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
                  <span className="text-xs text-muted-foreground">Li</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
                  <span className="text-xs text-muted-foreground">Tw</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
                  <span className="text-xs text-muted-foreground">Ig</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-display font-medium text-foreground mb-4">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  +1 (800) DENTCARE
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  concierge@dentacare.com
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>123 Wellness Boulevard<br />Beverly Hills, CA 90210</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-display font-medium text-foreground mb-4">Hours</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Monday - Friday</div>
                <div className="text-foreground">8:00 AM - 8:00 PM</div>
                <div className="mt-3">Saturday - Sunday</div>
                <div className="text-foreground">9:00 AM - 5:00 PM</div>
                <div className="mt-3 text-primary text-xs">24/7 Emergency Available</div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">
              © 2024 DentaCare Medical Sanctuary. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-muted-foreground/60">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;