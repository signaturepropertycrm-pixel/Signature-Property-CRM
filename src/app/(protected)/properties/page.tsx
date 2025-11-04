import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Copy,
  MoreHorizontal,
  Share2,
  Trash2,
  Edit,
  Video,
  CheckCircle,
} from 'lucide-react';
import { properties } from '@/lib/data';
import { AddPropertyDialog } from '@/components/add-property-dialog';
import { Input } from '@/components/ui/input';

function formatDemand(amount: number, unit: string) {
  return `${amount} ${unit}`;
}

function formatSize(value: number, unit: string) {
  return `${value} ${unit}`;
}

const statusVariant = {
  Available: 'default',
  Reserved: 'secondary',
  Sold: 'destructive',
  'Off-Market': 'outline',
} as const;

export default function PropertiesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            Properties
          </h1>
          <p className="text-muted-foreground">
            Manage your property listings.
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
          <Input placeholder="Search properties..." className="w-full md:w-64" />
          <AddPropertyDialog />
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead className="hidden md:table-cell">Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Demand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((prop) => (
              <TableRow key={prop.id}>
                <TableCell>
                  <div className="font-medium font-headline">
                    {prop.auto_title}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {prop.serial_no}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate">
                  {prop.address}
                </TableCell>
                <TableCell>{prop.property_type}</TableCell>
                <TableCell>
                  {formatSize(prop.size_value, prop.size_unit)}
                </TableCell>
                <TableCell>
                  {formatDemand(prop.demand_amount, prop.demand_unit)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[prop.status]}>
                    {prop.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckCircle />
                        Mark as Sold
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Video />
                        Mark as Recorded
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy />
                        Copy
                      DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    DropdownMenuContent>
                  </DropdownMenu>
                TableCell>Animation>
              </TableRow>
            ))}
          TableBody>
        Table>
      div>
    div>
  );
}
