package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Models (duplicated here to avoid import cycles or dependency on main package structure which is simple)
type Chapter struct {
	ID           uint         `gorm:"primaryKey" json:"id"`
	Name         string       `json:"name"`
	Description  string       `json:"description"`
	Vocabularies []Vocabulary `json:"vocabularies,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type Vocabulary struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Chinese   string    `json:"chinese"`
	Pinyin    string    `json:"pinyin"`
	Meaning   string    `json:"meaning"`
	ImageURL  string    `json:"image_url"`
	ChapterID uint      `json:"chapter_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func main() {
	// Adjust path to database
	dbPath := "../../chineselearn.db"
	// Ensure we are using the absolute path to avoid permission issues if CWD is weird
	if absPath, err := filepath.Abs("chineselearn.db"); err == nil {
		dbPath = absPath
	}
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}

	// Migrate the schema (just in case)
	db.AutoMigrate(&Chapter{}, &Vocabulary{})

	// Path to the CSV files
	csvDir := "/Users/mdjobayerarafat/Downloads/私人与共享/All words"

	files, err := os.ReadDir(csvDir)
	if err != nil {
		log.Fatal(err)
	}

	for _, file := range files {
		// Only process CSV files. We skip "_all.csv" as they seem to be duplicates/aggregates with different format.
		// However, checking the user's input, they provided "B ... .csv" and "B ..._all.csv".
		// Let's inspect the files again. The user showed "B ..._all.csv" content first, then "B ... .csv".
		// "B ... .csv" has "Pinyin" column.
		// "B ..._all.csv" has "Pinyin" column too.
		// The key difference is column order.
		// Let's try to process ALL csv files, but be smart about headers.
		// Wait, if "_all.csv" contains everything, maybe we should prioritize that? Or maybe they are just different exports.
		// Let's process files that do NOT contain "_all" first, as they seem to be the primary ones based on typical naming.
		// Actually, let's just process one type to avoid duplicates.
		// I'll stick to files that DO NOT have "_all" in the name, assuming they are the source.

		if filepath.Ext(file.Name()) == ".csv" && !strings.Contains(file.Name(), "_all.csv") {
			processCSV(db, filepath.Join(csvDir, file.Name()))
		}
	}
}

func processCSV(db *gorm.DB, filePath string) {
	f, err := os.Open(filePath)
	if err != nil {
		log.Printf("Unable to read input file %s", filePath)
		return
	}
	defer f.Close()

	csvReader := csv.NewReader(f)

	// Read header
	header, err := csvReader.Read()
	if err != nil {
		log.Printf("Unable to parse file as CSV for %s", filePath)
		return
	}

	// Map header columns to indices
	colMap := make(map[string]int)
	for i, h := range header {
		// Clean up BOM if present and trim spaces
		cleanHeader := strings.TrimSpace(strings.ReplaceAll(h, "\ufeff", ""))
		colMap[cleanHeader] = i
	}

	// Check if required columns exist
	if _, ok := colMap["Chinese"]; !ok {
		log.Printf("Missing 'Chinese' column in %s", filePath)
		return
	}

	filename := filepath.Base(filePath)

	// Determine Chapter Name from Filename
	// Filename example: "B 30c8c7dee7698089a03ec8604d614cb6.csv" -> "Chapter B"
	// User requested all words in "HSK1" chapter.
	// Since all these files seem to be HSK vocabulary, let's put them all in one big chapter "HSK 1"
	// or create a chapter named "HSK 1" and add everything there.
	chapterName := "HSK 1"

	// Create or Find Chapter
	var chapter Chapter
	if err := db.Where("name = ?", chapterName).First(&chapter).Error; err != nil {
		// Create new chapter
		chapter = Chapter{
			Name:        chapterName,
			Description: "All HSK 1 Vocabulary",
		}
		if err := db.Create(&chapter).Error; err != nil {
			log.Printf("Failed to create chapter %s: %v", chapterName, err)
			return
		}
		fmt.Printf("Created/Found Chapter: %s\n", chapter.Name)
	}

	rowCount := 0
	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error reading record in %s: %v", filePath, err)
			continue
		}

		// Extract data using column map
		chinese := getValue(record, colMap, "Chinese")
		pinyin := getValue(record, colMap, "Pinyin")
		meaning := getValue(record, colMap, "English Meaning")
		imageURL := getValue(record, colMap, "Files & media") // This might be empty or a local path/url

		// Skip if Chinese is empty
		if chinese == "" {
			continue
		}

		// Check if vocabulary already exists to avoid duplicates
		var existingVocab Vocabulary
		err = db.Where("chinese = ? AND chapter_id = ?", chinese, chapter.ID).First(&existingVocab).Error
		if err == nil {
			// Found existing, update it? Or skip.
			// Let's update it to ensure we have the latest info (e.g. meaning/image)
			existingVocab.Pinyin = pinyin
			existingVocab.Meaning = meaning
			existingVocab.ImageURL = imageURL
			db.Save(&existingVocab)
			rowCount++
			continue
		}

		vocab := Vocabulary{
			Chinese:   chinese,
			Pinyin:    pinyin,
			Meaning:   meaning,
			ImageURL:  imageURL,
			ChapterID: chapter.ID,
		}

		if err := db.Create(&vocab).Error; err != nil {
			log.Printf("Failed to insert vocab %s: %v", chinese, err)
		} else {
			rowCount++
		}
	}
	fmt.Printf("Imported %d words from %s\n", rowCount, filename)
}

func getValue(record []string, colMap map[string]int, colName string) string {
	idx, ok := colMap[colName]
	if !ok {
		// Try fallback for known variations
		if colName == "English Meaning" {
			if idx, ok = colMap["Meaning"]; ok {
				// found fallback
			}
		}
	}

	if ok && idx < len(record) {
		return strings.TrimSpace(record[idx])
	}
	return ""
}
