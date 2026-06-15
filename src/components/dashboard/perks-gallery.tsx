
"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PlaceHolderImages } from "@/lib/placeholder-images"

const perks = [
  { id: 1, name: "AWS Credit Voucher", points: 500, category: "Infrastructure", image: PlaceHolderImages[0] },
  { id: 2, name: "Premium Coffee", points: 150, category: "Lifestyle", image: PlaceHolderImages[1] },
  { id: 3, name: "Mechanical Keyboard", points: 1200, category: "Hardware", image: PlaceHolderImages[2] },
  { id: 4, name: "Company Swag Kit", points: 300, category: "Merchandise", image: PlaceHolderImages[3] },
  { id: 5, name: "Ultra-Wide Monitor", points: 2500, category: "Hardware", image: PlaceHolderImages[4] },
  { id: 6, name: "Noise Cancelling Headphones", points: 1800, category: "Audio", image: PlaceHolderImages[5] },
]

export function PerksGallery() {
  const { toast } = useToast()
  const [userPoints, setUserPoints] = useState(2850)
  const [redeeming, setRedeeming] = useState<number | null>(null)

  const handleRedeem = (perk: typeof perks[0]) => {
    if (userPoints < perk.points) {
      toast({
        title: "Insufficient Points",
        description: `You need ${perk.points - userPoints} more points to redeem this perk.`,
        variant: "destructive",
      })
      return
    }

    setRedeeming(perk.id)
    
    setTimeout(() => {
      setUserPoints(prev => prev - perk.points)
      setRedeeming(null)
      toast({
        title: "Redemption Successful",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <span>{perk.name} has been added to your inventory.</span>
          </div>
        ),
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl">Perks Gallery</h2>
        <Badge variant="outline" className="px-4 py-1.5 glass-card text-primary gap-2 text-lg">
          <Zap className="h-4 w-4 fill-primary" />
          <span className="point-number font-bold">{userPoints.toLocaleString()}</span>
        </Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {perks.map((perk) => (
          <Card key={perk.id} className="glass-card group overflow-hidden transition-all hover:scale-[1.02]">
            <div className="relative aspect-video overflow-hidden bg-muted">
              {perk.image?.imageUrl && (
                <Image 
                  src={perk.image.imageUrl} 
                  alt={perk.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint={perk.image.imageHint}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-md">
                {perk.category}
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">
                {perk.name}
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-accent" />
                <span className="point-number font-bold text-lg">{perk.points}</span>
              </div>
              <Button 
                onClick={() => handleRedeem(perk)}
                disabled={redeeming === perk.id}
                size="sm"
                className="bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30 transition-all font-medium"
              >
                {redeeming === perk.id ? "Processing..." : "Redeem"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
