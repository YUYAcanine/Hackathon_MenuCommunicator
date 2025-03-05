"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

export interface AllergenItem {
  id: string;
  name: string;
}

export interface AllergySelectorProps {
  onSave?: (selectedAllergies: string[]) => void;
}

export function AllergySelector({ onSave }: AllergySelectorProps) {
  // 特定原材料8品目 (8 mandatory allergens)
  const mandatoryAllergens: AllergenItem[] = [
    { id: "egg", name: "卵" },
    { id: "milk", name: "乳" },
    { id: "wheat", name: "小麦" },
    { id: "buckwheat", name: "そば" },
    { id: "peanut", name: "落花生" },
    { id: "shrimp", name: "えび" },
    { id: "crab", name: "かに" },
    { id: "soybean", name: "大豆" },
  ]

  // 特定原材料に準ずるもの20品目 (20 recommended allergens)
  const recommendedAllergens: AllergenItem[] = [
    { id: "abalone", name: "あわび" },
    { id: "squid", name: "いか" },
    { id: "salmon-roe", name: "いくら" },
    { id: "orange", name: "オレンジ" },
    { id: "kiwi", name: "キウイフルーツ" },
    { id: "beef", name: "牛肉" },
    { id: "walnut", name: "くるみ" },
    { id: "salmon", name: "さけ" },
    { id: "mackerel", name: "さば" },
    { id: "chicken", name: "鶏肉" },
    { id: "banana", name: "バナナ" },
    { id: "pork", name: "豚肉" },
    { id: "matsutake", name: "まつたけ" },
    { id: "peach", name: "もも" },
    { id: "yam", name: "やまいも" },
    { id: "apple", name: "りんご" },
    { id: "gelatin", name: "ゼラチン" },
    { id: "cashew", name: "カシューナッツ" },
    { id: "sesame", name: "ごま" },
    { id: "almond", name: "アーモンド" },
  ]

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const handleAllergyChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAllergies([...selectedAllergies, id])
    } else {
      setSelectedAllergies(selectedAllergies.filter((item) => item !== id))
    }
  }

  const clearAllergies = () => {
    setSelectedAllergies([])
  }

  const handleSave = () => {
    setIsOpen(false);
    if (onSave) {
      onSave(selectedAllergies)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full max-w-md mx-auto p-4">
        <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between p-0 h-auto">
                <h2 className="text-xl font-bold">アレルギー情報</h2>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
        <div className="w-full max-w-md mx-auto p-4 border rounded-lg shadow-sm bg-card">
        <div className="flex items-center justify-between mb-4">
            {selectedAllergies.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllergies}>
                クリア
            </Button>
            )}
        </div>

        {selectedAllergies.length > 0 && (
            <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">選択中のアレルギー:</p>
            <div className="flex flex-wrap gap-2">
                {selectedAllergies.map((id) => {
                const allergen = [...mandatoryAllergens, ...recommendedAllergens].find((a) => a.id === id)
                return (
                    <Badge key={id} variant="secondary">
                    {allergen?.name}
                    </Badge>
                )
                })}
            </div>
            </div>
        )}

        <div className="space-y-6">
            <div>
                <h3 className="font-medium mb-3">特定原材料</h3>
                <div className="grid grid-cols-2 gap-3">
                    {mandatoryAllergens.map((allergen) => (
                    <div key={allergen.id} className="flex items-start space-x-2">
                        <Checkbox
                        id={allergen.id}
                        checked={selectedAllergies.includes(allergen.id)}
                        onCheckedChange={(checked) => handleAllergyChange(allergen.id, checked as boolean)}
                        />
                        <Label
                        htmlFor={allergen.id}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        {allergen.name}
                        </Label>
                    </div>
                    ))}
                </div>
            </div>

            <h3 className="font-medium mb-3">特定原材料に準ずるもの</h3>
                <div className="grid grid-cols-2 gap-3">
                    {recommendedAllergens.map((allergen) => (
                    <div key={allergen.id} className="flex items-start space-x-2">
                        <Checkbox
                        id={allergen.id}
                        checked={selectedAllergies.includes(allergen.id)}
                        onCheckedChange={(checked) => handleAllergyChange(allergen.id, checked as boolean)}
                        />
                        <Label
                        htmlFor={allergen.id}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        {allergen.name}
                        </Label>
                    </div>
                    ))}
                </div>
        </div>

        <div className="mt-6">
            <Button className="w-full" onClick={handleSave}>保存する</Button>
        </div>
        </div>
        </CollapsibleContent>
    </Collapsible>
  )
}